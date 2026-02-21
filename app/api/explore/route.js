import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EXPLORE_ACTIVITIES, EXPLORE_CATEGORY_ORDER } from '@/app/lib/exploreActivities'

// Ensure table exists with new columns
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS explore_keeps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      activity_id TEXT NOT NULL,
      category TEXT NOT NULL,
      horizon TEXT NOT NULL,
      activity_text TEXT NOT NULL,
      kept_at DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE(user_id, activity_id)
    )
  `
  // Add new columns for walk reflection flow
  await sql`ALTER TABLE explore_keeps ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'`
  await sql`ALTER TABLE explore_keeps ADD COLUMN IF NOT EXISTS reflection_text TEXT`
  await sql`ALTER TABLE explore_keeps ADD COLUMN IF NOT EXISTS completed_at DATE`
}

// Deterministic daily random: pick one activity per category based on date seed
function getDailyActivities(dateStr, keptActivityIds) {
  // Simple hash from date string
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed + dateStr.charCodeAt(i)) | 0
  }

  const cards = []
  for (const catKey of EXPLORE_CATEGORY_ORDER) {
    const cat = EXPLORE_ACTIVITIES[catKey]
    const allActivities = [
      ...cat.today.map(a => ({ ...a, horizon: 'today' })),
      ...cat.month.map(a => ({ ...a, horizon: 'month' })),
      ...cat.lifetime.map(a => ({ ...a, horizon: 'lifetime' })),
    ]

    // Filter out already-kept activities (both planned and completed)
    const available = allActivities.filter(a => !keptActivityIds.has(a.id))
    if (available.length === 0) {
      cards.push({
        category: catKey,
        label: cat.label,
        subtitle: cat.subtitle,
        color: cat.color,
        allDone: true,
        activity: null,
      })
      continue
    }

    // Deterministic pick based on date + category
    let catSeed = seed
    for (let i = 0; i < catKey.length; i++) {
      catSeed = ((catSeed << 5) - catSeed + catKey.charCodeAt(i)) | 0
    }
    const index = Math.abs(catSeed) % available.length
    const picked = available[index]

    cards.push({
      category: catKey,
      label: cat.label,
      subtitle: cat.subtitle,
      color: cat.color,
      allDone: false,
      activity: picked,
    })
  }

  return cards
}

// GET: fetch today's explore cards + user's kept/planned activities
export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ cards: [], keeps: [], plannedWalks: [], keptToday: false, totalKept: 0, plannedCount: 0 })
    }
    const userId = userResult.rows[0].id

    // Get all activity IDs (both planned and completed) to exclude from daily cards
    const allKeepsResult = await sql`
      SELECT activity_id, category, horizon, activity_text, kept_at, status, reflection_text, completed_at
      FROM explore_keeps
      WHERE user_id = ${userId}
      ORDER BY kept_at DESC
    `
    const keptActivityIds = new Set(allKeepsResult.rows.map(r => r.activity_id))

    // Split into completed and planned
    const completedKeeps = allKeepsResult.rows.filter(r => r.status === 'completed')
    const plannedWalks = allKeepsResult.rows.filter(r => r.status === 'planned')

    // Check if user already saved a walk today
    const { searchParams } = new URL(request.url)
    const localDate = searchParams.get('localDate') || new Date().toISOString().split('T')[0]

    const todayKeep = await sql`
      SELECT id FROM explore_keeps
      WHERE user_id = ${userId} AND kept_at = ${localDate}
    `
    const keptToday = todayKeep.rows.length > 0

    // Get today's cards
    const cards = getDailyActivities(localDate, keptActivityIds)

    return Response.json({
      cards,
      keeps: completedKeeps,
      plannedWalks,
      keptToday,
      totalKept: completedKeeps.length,
      plannedCount: plannedWalks.length,
    })
  } catch (error) {
    console.error('Error fetching explore:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: save a walk as planned (1 new per day, max 3 planned)
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const { activityId, category, horizon, activityText, localDate } = await request.json()
    if (!activityId || !category || !horizon || !activityText) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const userId = userResult.rows[0].id

    const dateToUse = localDate || new Date().toISOString().split('T')[0]

    // Check daily limit (1 new save per day)
    const todayKeep = await sql`
      SELECT id FROM explore_keeps
      WHERE user_id = ${userId} AND kept_at = ${dateToUse}
    `
    if (todayKeep.rows.length > 0) {
      return Response.json({ error: 'Already saved a walk today' }, { status: 400 })
    }

    // Check planned queue limit (max 3)
    const plannedCount = await sql`
      SELECT COUNT(*) as count FROM explore_keeps
      WHERE user_id = ${userId} AND status = 'planned'
    `
    if (parseInt(plannedCount.rows[0].count) >= 3) {
      return Response.json({ error: 'You can have up to 3 planned walks. Complete or remove one first.' }, { status: 400 })
    }

    await sql`
      INSERT INTO explore_keeps (user_id, activity_id, category, horizon, activity_text, kept_at, status)
      VALUES (${userId}, ${activityId}, ${category}, ${horizon}, ${activityText}, ${dateToUse}, 'planned')
      ON CONFLICT (user_id, activity_id) DO NOTHING
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error saving walk:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH: complete a planned walk with reflection
export async function PATCH(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const { activityId, reflectionText } = await request.json()
    if (!activityId || !reflectionText) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (reflectionText.trim().length < 5) {
      return Response.json({ error: 'Reflection must be at least 5 characters' }, { status: 400 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const userId = userResult.rows[0].id

    const result = await sql`
      UPDATE explore_keeps
      SET status = 'completed', reflection_text = ${reflectionText.trim()}, completed_at = CURRENT_DATE
      WHERE user_id = ${userId} AND activity_id = ${activityId} AND status = 'planned'
    `

    if (result.rowCount === 0) {
      return Response.json({ error: 'Walk not found or already completed' }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error completing walk:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: cancel a planned walk
export async function DELETE(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    if (!activityId) {
      return Response.json({ error: 'Missing activityId' }, { status: 400 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const userId = userResult.rows[0].id

    await sql`
      DELETE FROM explore_keeps
      WHERE user_id = ${userId} AND activity_id = ${activityId} AND status = 'planned'
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error cancelling walk:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
