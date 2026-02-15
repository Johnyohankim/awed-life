import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, journalText, isPublic, isSubmission } = await request.json()

    if (!submissionId || !journalText) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // Get submission details to check category
    const submissionResult = await sql`
      SELECT category FROM submissions WHERE id = ${submissionId}
    `
    if (submissionResult.rows.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }
    const category = submissionResult.rows[0].category

    // Get user's submission points and calculate allowed keeps
    const userResult = await sql`
      SELECT submission_points, streak_count, last_keep_date
      FROM users WHERE id = ${userId}
    `
    const user = userResult.rows[0]
    const submissionPoints = user?.submission_points || 0
    const allowedKeeps = Math.min(1 + submissionPoints, 8)

    // Check: How many cards kept today (excluding submission cards)
    const keptTodayResult = await sql`
      SELECT COUNT(*) as count
      FROM user_cards
      WHERE user_id = ${userId}
        AND DATE(kept_at) = ${today}
        AND is_submission = false
    `
    const keptToday = parseInt(keptTodayResult.rows[0]?.count || 0)

    // Check: Already kept a card from this category today?
    const categoryKeptResult = await sql`
      SELECT COUNT(*) as count
      FROM user_cards uc
      JOIN submissions s ON s.id = uc.submission_id
      WHERE uc.user_id = ${userId}
        AND DATE(uc.kept_at) = ${today}
        AND s.category = ${category}
        AND uc.is_submission = false
    `
    const categoryKeptToday = parseInt(categoryKeptResult.rows[0]?.count || 0)

    // Enforce limits
    if (keptToday >= allowedKeeps) {
      return Response.json({ 
        error: `Daily limit reached. You can keep ${allowedKeeps} card${allowedKeeps > 1 ? 's' : ''} per day.`,
        keptToday,
        allowedKeeps
      }, { status: 400 })
    }

    if (categoryKeptToday > 0) {
      return Response.json({ 
        error: `You've already kept a ${category.replace(/-/g, ' ')} card today. Try a different category!`,
        category
      }, { status: 400 })
    }

    // Check if already kept this specific submission
    const existingResult = await sql`
      SELECT id FROM user_cards
      WHERE user_id = ${userId} AND submission_id = ${submissionId}
    `

    if (existingResult.rows.length > 0) {
      return Response.json({ error: 'Card already in collection' }, { status: 400 })
    }

    // Calculate streak
    const lastKeepDate = user?.last_keep_date
    const currentStreak = user?.streak_count || 0
    let newStreak = 1

    if (lastKeepDate) {
      const lastDate = new Date(lastKeepDate).toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      if (lastDate === yesterday) {
        newStreak = currentStreak + 1
      } else if (lastDate === today) {
        newStreak = currentStreak
      }
    }

    // Keep the card
    await sql`
      INSERT INTO user_cards (user_id, submission_id, journal_text, is_public, is_submission, kept_at)
      VALUES (${userId}, ${submissionId}, ${journalText}, ${isPublic}, ${isSubmission || false}, NOW())
    `

    // Update user streak
    await sql`
      UPDATE users
      SET streak_count = ${newStreak}, last_keep_date = CURRENT_DATE
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