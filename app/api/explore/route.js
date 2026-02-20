import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS explore_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      activity_id TEXT NOT NULL,
      collected_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, activity_id)
    )
  `
}

// GET: fetch user's collected activities
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ collected: [] })
    }
    const userId = userResult.rows[0].id

    const result = await sql`
      SELECT activity_id, collected_at
      FROM explore_activities
      WHERE user_id = ${userId}
      ORDER BY collected_at DESC
    `

    return Response.json({ collected: result.rows })
  } catch (error) {
    console.error('Error fetching explore activities:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: collect an activity
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    const { activityId } = await request.json()
    if (!activityId) {
      return Response.json({ error: 'Missing activityId' }, { status: 400 })
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    const userId = userResult.rows[0].id

    await sql`
      INSERT INTO explore_activities (user_id, activity_id)
      VALUES (${userId}, ${activityId})
      ON CONFLICT (user_id, activity_id) DO NOTHING
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error collecting activity:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: uncollect an activity
export async function DELETE(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
      DELETE FROM explore_activities
      WHERE user_id = ${userId} AND activity_id = ${activityId}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error uncollecting activity:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
