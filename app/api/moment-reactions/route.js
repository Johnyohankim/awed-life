import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, reactionType } = await request.json()

    if (!['awed', 'nawed'].includes(reactionType)) {
      return Response.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `
    const userId = userResult.rows[0].id

    // Check existing reaction
    const existing = await sql`
      SELECT * FROM moment_reactions
      WHERE user_id = ${userId}
      AND submission_id = ${submissionId}
    `

    if (existing.rows.length > 0) {
      const current = existing.rows[0].reaction_type

      if (current === reactionType) {
        // Toggle off
        await sql`
          DELETE FROM moment_reactions
          WHERE user_id = ${userId}
          AND submission_id = ${submissionId}
        `
        return Response.json({ success: true, action: 'removed', reaction: null })
      } else {
        // Switch reaction
        await sql`
          UPDATE moment_reactions
          SET reaction_type = ${reactionType}
          WHERE user_id = ${userId}
          AND submission_id = ${submissionId}
        `
        return Response.json({ success: true, action: 'updated', reaction: reactionType })
      }
    } else {
      // New reaction
      await sql`
        INSERT INTO moment_reactions (user_id, submission_id, reaction_type)
        VALUES (${userId}, ${submissionId}, ${reactionType})
      `
      return Response.json({ success: true, action: 'added', reaction: reactionType })
    }

  } catch (error) {
    console.error('Error handling moment reaction:', error)
    return Response.json({ error: 'Failed to handle reaction' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `
    const userId = userResult.rows[0].id

    // Get counts
    const counts = await sql`
      SELECT 
        COUNT(CASE WHEN reaction_type = 'awed' THEN 1 END) as awed_count,
        COUNT(CASE WHEN reaction_type = 'nawed' THEN 1 END) as nawed_count
      FROM moment_reactions
      WHERE submission_id = ${submissionId}
    `

    // Get user's reaction
    const userReaction = await sql`
      SELECT reaction_type FROM moment_reactions
      WHERE user_id = ${userId}
      AND submission_id = ${submissionId}
    `

    return Response.json({
      awedCount: parseInt(counts.rows[0].awed_count),
      nawedCount: parseInt(counts.rows[0].nawed_count),
      userReaction: userReaction.rows[0]?.reaction_type || null
    })

  } catch (error) {
    console.error('Error getting reactions:', error)
    return Response.json({ error: 'Failed to get reactions' }, { status: 500 })
  }
}