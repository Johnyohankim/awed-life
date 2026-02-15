import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, journalText, isPublic, isSubmission, question } = await request.json()

    if (!journalText || journalText.trim().length < 10) {
      return Response.json({ error: 'Journal entry too short' }, { status: 400 })
    }

    const userResult = await sql`
      SELECT id, submission_points FROM users WHERE email = ${session.user.email}
    `

    const userId = userResult.rows[0].id
    const submissionPoints = userResult.rows[0]?.submission_points || 0
    const allowedKeeps = Math.min(1 + submissionPoints, 8)
    const today = new Date().toISOString().split('T')[0]

    // Get submission category
    const submissionResult = await sql`
      SELECT category FROM submissions WHERE id = ${submissionId}
    `
    if (submissionResult.rows.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }
    const category = submissionResult.rows[0].category

    // Check how many cards kept today (excluding submission cards)
    const keptTodayResult = await sql`
      SELECT COUNT(*) as count
      FROM user_cards
      WHERE user_id = ${userId}
        AND DATE(kept_at) = ${today}
        AND (is_submission = false OR is_submission IS NULL)
    `
    const keptToday = parseInt(keptTodayResult.rows[0]?.count || 0)

    // Check if already kept a card from this category today
    const categoryKeptResult = await sql`
      SELECT COUNT(*) as count
      FROM user_cards uc
      JOIN submissions s ON s.id = uc.submission_id
      WHERE uc.user_id = ${userId}
        AND DATE(uc.kept_at) = ${today}
        AND s.category = ${category}
        AND (uc.is_submission = false OR uc.is_submission IS NULL)
    `
    const categoryKeptToday = parseInt(categoryKeptResult.rows[0]?.count || 0)

    // Enforce limits
    if (keptToday >= allowedKeeps) {
      return Response.json({ 
        error: `Daily limit reached. You can keep ${allowedKeeps} card${allowedKeeps > 1 ? 's' : ''} per day.`
      }, { status: 400 })
    }

    if (categoryKeptToday > 0) {
      return Response.json({ 
        error: `You've already kept a ${category.replace(/-/g, ' ')} card today. Try a different category!`
      }, { status: 400 })
    }

    // Save card to collection
    await sql`
      INSERT INTO user_cards (user_id, submission_id, journal_text, journal_question, is_public, is_submission)
      VALUES (${userId}, ${submissionId}, ${journalText.trim()}, ${question || null}, ${isPublic || false}, ${isSubmission || false})
    `

    // Mark card as shown
    await sql`
      INSERT INTO shown_cards (user_id, submission_id, shown_at)
      VALUES (${userId}, ${submissionId}, NOW())
      ON CONFLICT (user_id, submission_id) DO UPDATE SET shown_at = NOW()
    `

    // Update streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const streakResult = await sql`
      SELECT streak_count, last_card_date FROM users WHERE id = ${userId}
    `

    let newStreak = 1
    if (streakResult.rows.length > 0) {
      const lastCardDate = streakResult.rows[0].last_card_date
      const currentStreak = streakResult.rows[0].streak_count || 0

      if (lastCardDate) {
        const lastDate = new Date(lastCardDate).toISOString().split('T')[0]
        if (lastDate === yesterdayStr) {
          newStreak = currentStreak + 1
        } else if (lastDate === today) {
          newStreak = currentStreak
        }
      }
    }

    await sql`
      UPDATE users
      SET streak_count = ${newStreak}, last_card_date = CURRENT_DATE
      WHERE id = ${userId}
    `

    return Response.json({ 
      success: true, 
      streak: newStreak,
      keptToday: keptToday + 1,
      allowedKeeps
    })

  } catch (error) {
    console.error('Error keeping card:', error)
    return Response.json({ error: 'Failed to keep card' }, { status: 500 })
  }
}