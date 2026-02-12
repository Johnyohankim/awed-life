import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET own profile or public profile by ID
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await sql`
      SELECT id, name, email, streak_count, created_at
      FROM users WHERE email = ${session.user.email}
    `

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Get collection stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT s.category) as categories_count
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${user.id}
    `

    // Get recent 8 cards
    const recentResult = await sql`
      SELECT 
        uc.id,
        s.category,
        uc.kept_at
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${user.id}
      ORDER BY uc.kept_at DESC
      LIMIT 8
    `

    return Response.json({
      id: user.id,
      name: user.name,
      createdAt: user.created_at,
      streak: user.streak_count || 0,
      totalCards: parseInt(statsResult.rows[0].total_cards),
      categoriesCount: parseInt(statsResult.rows[0].categories_count),
      recentCards: recentResult.rows
    })

  } catch (error) {
    console.error('Error getting profile:', error)
    return Response.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

// PATCH - update name
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim().length === 0) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    await sql`
      UPDATE users SET name = ${name.trim()}
      WHERE email = ${session.user.email}
    `

    return Response.json({ success: true })

  } catch (error) {
    console.error('Error updating profile:', error)
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}