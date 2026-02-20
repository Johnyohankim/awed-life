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
        COUNT(*) as total_cards
      FROM user_cards uc
      WHERE uc.user_id = ${user.id}
    `

    // Count explore walks (table may not exist yet)
    let totalWalks = 0
    try {
      const walksResult = await sql`
        SELECT COUNT(*) as total_walks
        FROM explore_keeps
        WHERE user_id = ${user.id}
      `
      totalWalks = parseInt(walksResult.rows[0].total_walks)
    } catch (e) {
      // table doesn't exist yet, that's fine
    }

    return Response.json({
      id: user.id,
      name: user.name,
      createdAt: user.created_at,
      totalCards: parseInt(statsResult.rows[0].total_cards),
      totalWalks,
    })

  } catch (error) {
    console.error('Error getting public profile:', error)
    return Response.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}