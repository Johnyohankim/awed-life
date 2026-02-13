import { sql } from '@vercel/postgres'
// profile route updated
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const userResult = await sql`
      SELECT id, name, email, streak_count, created_at, submission_points
      FROM users WHERE id = ${userId}
    `

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT s.category) as categories_count
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
    `

    const recentResult = await sql`
      SELECT 
        uc.id,
        s.category,
        uc.kept_at,
        uc.is_submission
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.kept_at DESC
      LIMIT 8
    `

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      streak: user.streak_count || 0,
      totalCards: parseInt(statsResult.rows[0].total_cards),
      categoriesCount: parseInt(statsResult.rows[0].categories_count),
      submissionPoints: user.submission_points || 0,
      recentCards: recentResult.rows
    })

  } catch (error) {
    console.error('Error getting profile:', error)
    return Response.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name?.trim()) {
      return Response.json({ error: 'Name required' }, { status: 400 })
    }

    await sql`
      UPDATE users SET name = ${name.trim()} WHERE id = ${session.user.id}
    `

    return Response.json({ success: true })

  } catch (error) {
    console.error('Error updating profile:', error)
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}