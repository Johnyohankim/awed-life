import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, journalText, isPublic } = await request.json()

    if (!journalText || journalText.trim().length < 10) {
      return Response.json({ error: 'Journal entry too short' }, { status: 400 })
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    const userId = userResult.rows[0].id
    const today = new Date().toISOString().split('T')[0]

    // Check if user already kept a card today
    const alreadyKept = await sql`
      SELECT uc.id
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
      AND DATE(uc.kept_at) = ${today}
    `

    if (alreadyKept.rows.length > 0) {
      return Response.json({ error: 'Already kept a card today' }, { status: 400 })
    }

    // Save card to collection
    await sql`
      INSERT INTO user_cards (user_id, submission_id, journal_text, is_public)
      VALUES (${userId}, ${submissionId}, ${journalText.trim()}, ${isPublic || false})
    `

    // Mark card as shown
    await sql`
      INSERT INTO shown_cards (user_id, submission_id)
      VALUES (${userId}, ${submissionId})
      ON CONFLICT (user_id, submission_id) DO NOTHING
    `

    // Update streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const streakResult = await sql`
      SELECT streak_count, last_card_date FROM users WHERE id = ${userId}
    `

    const user = streakResult.rows[0]
    let newStreak = 1

    if (user.last_card_date) {
      const lastDate = new Date(user.last_card_date).toISOString().split('T')[0]
      if (lastDate === yesterdayStr) {
        newStreak = (user.streak_count || 0) + 1
      }
    }

    await sql`
      UPDATE users
      SET streak_count = ${newStreak}, last_card_date = ${today}
      WHERE id = ${userId}
    `

    return Response.json({ success: true, streak: newStreak })

  } catch (error) {
    console.error('Error keeping card:', error)
    return Response.json({ error: 'Failed to keep card' }, { status: 500 })
  }
}