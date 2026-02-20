import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EXPLORE_ACTIVITIES, EXPLORE_CATEGORY_ORDER } from '@/app/lib/exploreActivities'

// Ensure table exists
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

    // Filter out already-kept activities
    const available = allActivities.filter(a => !keptActivityIds.has(a.id))
    if (available.length === 0) {
      // All done for this category
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

// GET: fetch today's explore cards + user's kept activities
export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ cards: [], keeps: [], keptToday: false })
    }
    const userId = userResult.rows[0].id

    // Get all kept activity IDs
    const keepsResult = await sql`
      SELECT activity_id, category, horizon, activity_text, kept_at
      FROM explore_keeps
      WHERE user_id = ${userId}
      ORDER BY kept_at DESC
    `
    const keptActivityIds = new Set(keepsResult.rows.map(r => r.activity_id))

    // Check if user already kept an explore card today
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
      keeps: keepsResult.rows,
      keptToday,
      totalKept: keepsResult.rows.length,
    })
  } catch (error) {
    console.error('Error fetching explore:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: keep an explore card (1 per day)
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

    // Check daily limit
    const todayKeep = await sql`
      SELECT id FROM explore_keeps
      WHERE user_id = ${userId} AND kept_at = ${dateToUse}
    `
    if (todayKeep.rows.length > 0) {
      return Response.json({ error: 'Already kept an explore card today' }, { status: 400 })
    }

    await sql`
      INSERT INTO explore_keeps (user_id, activity_id, category, horizon, activity_text, kept_at)
      VALUES (${userId}, ${activityId}, ${category}, ${horizon}, ${activityText}, ${dateToUse})
      ON CONFLICT (user_id, activity_id) DO NOTHING
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error keeping explore card:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
