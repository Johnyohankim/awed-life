import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Get total users
    const usersResult = await sql`
      SELECT COUNT(*) as count FROM users
    `
    const totalUsers = parseInt(usersResult.rows[0]?.count || 0)

    // Get total moments collected (cards kept)
    const cardsResult = await sql`
      SELECT COUNT(*) as count FROM user_cards
    `
    const totalMoments = parseInt(cardsResult.rows[0]?.count || 0)

    // Get total approved submissions
    const submissionsResult = await sql`
      SELECT COUNT(*) as count FROM submissions WHERE approved = true
    `
    const totalSubmissions = parseInt(submissionsResult.rows[0]?.count || 0)

    // Get total streaks (users with streak > 0)
    const streaksResult = await sql`
      SELECT COUNT(*) as count FROM users WHERE streak_count > 0
    `
    const activeStreaks = parseInt(streaksResult.rows[0]?.count || 0)

    return Response.json({
      totalUsers,
      totalMoments,
      totalSubmissions,
      activeStreaks
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    // Return fallback stats if DB fails
    return Response.json({
      totalUsers: 0,
      totalMoments: 0,
      totalSubmissions: 0,
      activeStreaks: 0
    })
  }
}