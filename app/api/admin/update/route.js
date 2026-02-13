import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const { id, action, category } = await request.json()

    if (action === 'approve') {
      // Approve the submission
      await sql`UPDATE submissions SET approved = true WHERE id = ${id}`

      // Check if submitted by a logged-in user
      const result = await sql`
        SELECT submitted_by_user_id, category FROM submissions WHERE id = ${id}
      `
      const submission = result.rows[0]

      if (submission?.submitted_by_user_id) {
        const userId = submission.submitted_by_user_id

        // Check if already in their collection
        const existing = await sql`
          SELECT id FROM user_cards 
          WHERE user_id = ${userId} AND submission_id = ${id}
        `

        if (existing.rows.length === 0) {
          // Auto-add to their collection with is_submission = true
          await sql`
            INSERT INTO user_cards (user_id, submission_id, journal_text, is_public, is_submission)
            VALUES (${userId}, ${id}, 'I submitted this awe moment ✨', false, true)
          `
        }

        // Award +1 submission point
        await sql`
          UPDATE users 
          SET submission_points = COALESCE(submission_points, 0) + 1
          WHERE id = ${userId}
        `
      }

    } else if (action === 'unapprove') {
      await sql`UPDATE submissions SET approved = false WHERE id = ${id}`

    } else if (action === 'reject') {
      await sql`DELETE FROM submissions WHERE id = ${id}`

    } else if (action === 'update-category') {
      if (!category) {
        return Response.json({ error: 'Category required' }, { status: 400 })
      }
      await sql`UPDATE submissions SET category = ${category} WHERE id = ${id}`

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error('Admin update error:', error)
    return Response.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}