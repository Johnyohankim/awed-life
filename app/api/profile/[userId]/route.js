import { sql } from '@vercel/postgres'

export async function GET(request, { params }) {
  try {
    const { userId } = await params

    const userResult = await sql`
      SELECT id, name, streak_count, created_at
      FROM users WHERE id = ${parseInt(userId, 10)}
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
      WHERE uc.user_id = ${user.id}
    `

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
    console.error('Error getting public profile:', error)
    return Response.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}