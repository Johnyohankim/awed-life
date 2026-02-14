import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return Response.json({ error: 'submissionId required' }, { status: 400 })
    }

    // Get reaction counts
    const countsResult = await sql`
      SELECT reaction_type, COUNT(*) as count
      FROM moment_reactions
      WHERE submission_id = ${submissionId}
      GROUP BY reaction_type
    `

    const awedCount = countsResult.rows.find(r => r.reaction_type === 'awed')?.count || 0
    const nawedCount = countsResult.rows.find(r => r.reaction_type === 'nawed')?.count || 0

    // Get user's reaction
    const userReactionResult = await sql`
      SELECT reaction_type
      FROM moment_reactions
      WHERE submission_id = ${submissionId} AND user_id = ${session.user.id}
    `

    const userReaction = userReactionResult.rows[0]?.reaction_type || null

    return Response.json({
      awedCount: parseInt(awedCount),
      nawedCount: parseInt(nawedCount),
      userReaction
    })

  } catch (error) {
    console.error('Error getting moment reactions:', error)
    return Response.json({ error: 'Failed to get reactions' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, reactionType } = await request.json()

    if (!submissionId || !reactionType) {
      return Response.json({ error: 'submissionId and reactionType required' }, { status: 400 })
    }

    if (!['awed', 'nawed'].includes(reactionType)) {
      return Response.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    const userId = session.user.id

    // Check if user already reacted
    const existingResult = await sql`
      SELECT reaction_type FROM moment_reactions
      WHERE submission_id = ${submissionId} AND user_id = ${userId}
    `

    if (existingResult.rows.length > 0) {
      const existingReaction = existingResult.rows[0].reaction_type

      if (existingReaction === reactionType) {
        // Same reaction - remove it
        await sql`
          DELETE FROM moment_reactions
          WHERE submission_id = ${submissionId} AND user_id = ${userId}
        `
        return Response.json({ success: true, action: 'removed' })
      } else {
        // Different reaction - update it
        await sql`
          UPDATE moment_reactions
          SET reaction_type = ${reactionType}
          WHERE submission_id = ${submissionId} AND user_id = ${userId}
        `
        
        // If switching TO nawed, mark as shown to skip tomorrow
        if (reactionType === 'nawed') {
          await sql`
            INSERT INTO shown_cards (user_id, submission_id, shown_at)
            VALUES (${userId}, ${submissionId}, NOW())
            ON CONFLICT (user_id, submission_id) DO UPDATE SET shown_at = NOW()
          `
        }
        
        return Response.json({ success: true, action: 'updated' })
      }
    } else {
      // New reaction
      await sql`
        INSERT INTO moment_reactions (submission_id, user_id, reaction_type)
        VALUES (${submissionId}, ${userId}, ${reactionType})
      `
      
      // If nawed, mark as shown to skip tomorrow
      if (reactionType === 'nawed') {
        await sql`
          INSERT INTO shown_cards (user_id, submission_id, shown_at)
          VALUES (${userId}, ${submissionId}, NOW())
          ON CONFLICT (user_id, submission_id) DO UPDATE SET shown_at = NOW()
        `
      }
      
      return Response.json({ success: true, action: 'added' })
    }

  } catch (error) {
    console.error('Error creating moment reaction:', error)
    return Response.json({ error: 'Failed to create reaction' }, { status: 500 })
  }
}