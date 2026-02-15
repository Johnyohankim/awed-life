import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await sql`
      SELECT id, streak_count FROM users WHERE email = ${session.user.email}
    `

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id
    const streakCount = userResult.rows[0].streak_count || 0

    // Get all kept cards with submission details
    const cardsResult = await sql`
      SELECT 
        uc.id,
        uc.journal_text,
        uc.journal_question,
        uc.is_public,
        uc.kept_at,
        s.id as submission_id,
        s.video_link,
        s.category,
        s.hashtags
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.kept_at DESC
    `

    const cards = cardsResult.rows

    // For public cards, get other users' journals on same submission
    const cardsWithJournals = await Promise.all(
      cards.map(async (card) => {
        if (card.is_public) {
          const othersResult = await sql`
            SELECT uc.journal_text
            FROM user_cards uc
            WHERE uc.submission_id = ${card.submission_id}
            AND uc.user_id != ${userId}
            AND uc.is_public = true
            ORDER BY uc.kept_at DESC
            LIMIT 5
          `
          return { ...card, public_journals: othersResult.rows }
        }
        return { ...card, public_journals: [] }
      })
    )

    // Calculate stats
    const uniqueCategories = [...new Set(cards.map(c => c.category))]

    const stats = {
      total: cards.length,
      streak: streakCount,
      categories: uniqueCategories.length
    }

    return Response.json({
      cards: cardsWithJournals,
      stats
    })

  } catch (error) {
    console.error('Error getting collection:', error)
    return Response.json({ error: 'Failed to get collection' }, { status: 500 })
  }
}