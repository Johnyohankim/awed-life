import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Calculate streak from consecutive days with kept cards
function calculateStreak(dates) {
  if (dates.length === 0) return 0

  // Sort dates descending (most recent first)
  const sortedDates = dates
    .map(d => new Date(d.kept_date))
    .sort((a, b) => b - a)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let currentDate = new Date(today)

  for (const date of sortedDates) {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((currentDate - checkDate) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      // Same day as expected
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (daysDiff === 1) {
      // Next consecutive day
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      // Streak broken
      break
    }
  }

  return streak
}

// Check if user has reached milestones and hasn't claimed yet
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Get all unique days with cards
    const cardsResult = await sql`
      SELECT DISTINCT DATE(kept_at) as kept_date
      FROM user_cards
      WHERE user_id = ${userId}
      ORDER BY kept_date DESC
    `
    const totalDays = cardsResult.rows.length
    const currentStreak = calculateStreak(cardsResult.rows)

    // Check which rewards have been claimed
    const claimsResult = await sql`
      SELECT milestone_type
      FROM reward_claims
      WHERE user_id = ${userId}
    `
    const claimedMilestones = new Set(claimsResult.rows.map(r => r.milestone_type))

    // Determine which milestones are newly reached
    const newMilestones = []

    if (currentStreak >= 7 && !claimedMilestones.has('7_day_streak')) {
      newMilestones.push('7_day_streak')
    }

    if (totalDays >= 20 && !claimedMilestones.has('20_total_days')) {
      newMilestones.push('20_total_days')
    }

    return Response.json({
      currentStreak,
      totalDays,
      newMilestones,
      claimedMilestones: Array.from(claimedMilestones)
    })

  } catch (error) {
    console.error('Error checking milestones:', error)
    return Response.json({ error: 'Failed to check milestones' }, { status: 500 })
  }
}

// Claim a reward
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { milestone, shippingInfo } = await request.json()

    if (!milestone || !shippingInfo) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { fullName, address, city, state, zipCode, country, phone } = shippingInfo

    if (!fullName || !address || !city || !state || !zipCode || !country) {
      return Response.json({ error: 'Missing required shipping fields' }, { status: 400 })
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `
    const userId = userResult.rows[0]?.id

    if (!userId) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already claimed
    const existing = await sql`
      SELECT id FROM reward_claims
      WHERE user_id = ${userId} AND milestone_type = ${milestone}
    `

    if (existing.rows.length > 0) {
      return Response.json({ error: 'Reward already claimed' }, { status: 400 })
    }

    // Create reward_claims table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS reward_claims (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        milestone_type TEXT NOT NULL,
        full_name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        country TEXT NOT NULL,
        phone TEXT,
        claimed_at TIMESTAMP DEFAULT NOW(),
        shipped BOOLEAN DEFAULT false,
        UNIQUE(user_id, milestone_type)
      )
    `

    // Save claim
    await sql`
      INSERT INTO reward_claims (
        user_id, milestone_type, full_name, address, city, state, zip_code, country, phone
      )
      VALUES (
        ${userId}, ${milestone}, ${fullName}, ${address}, ${city}, ${state}, ${zipCode}, ${country}, ${phone || ''}
      )
    `

    return Response.json({ success: true })

  } catch (error) {
    console.error('Error claiming reward:', error)
    return Response.json({ error: 'Failed to claim reward' }, { status: 500 })
  }
}
