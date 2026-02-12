import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userCardId, reactionType } = await request.json()

    if (!['awed', 'nawed'].includes(reactionType)) {
      return Response.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    // Get user id
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `
    const userId = userResult.rows[0].id

    // Check if reaction already exists
    const existing = await sql`
      SELECT * FROM reactions
      WHERE user_id = ${userId}
      AND user_card_id = ${userCardId}
    `

    if (existing.rows.length > 0) {
      const currentReaction = existing.rows[0].reaction_type

      if (currentReaction === reactionType) {
        // Same reaction - toggle off
        await sql`
          DELETE FROM reactions
          WHERE user_id = ${userId}
          AND user_card_id = ${userCardId}
        `

        if (reactionType === 'awed') {
          await sql`
            UPDATE user_cards
            SET awed_count = GREATEST(awed_count - 1, 0)
            WHERE id = ${userCardId}
          `
        } else {
          await sql`
            UPDATE user_cards
            SET nawed_count = GREATEST(nawed_count - 1, 0)
            WHERE id = ${userCardId}
          `
        }

        return Response.json({ success: true, action: 'removed', reaction: null })

      } else {
        // Different reaction - switch it
        await sql`
          UPDATE reactions
          SET reaction_type = ${reactionType}
          WHERE user_id = ${userId}
          AND user_card_id = ${userCardId}
        `

        if (reactionType === 'awed') {
          await sql`
            UPDATE user_cards
            SET awed_count = awed_count + 1,
                nawed_count = GREATEST(nawed_count - 1, 0)
            WHERE id = ${userCardId}
          `
        } else {
          await sql`
            UPDATE user_cards
            SET nawed_count = nawed_count + 1,
                awed_count = GREATEST(awed_count - 1, 0)
            WHERE id = ${userCardId}
          `
        }

        return Response.json({ success: true, action: 'updated', reaction: reactionType })
      }

    } else {
      // New reaction
      await sql`
        INSERT INTO reactions (user_id, user_card_id, reaction_type)
        VALUES (${userId}, ${userCardId}, ${reactionType})
      `

      if (reactionType === 'awed') {
        await sql`
          UPDATE user_cards SET awed_count = awed_count + 1
          WHERE id = ${userCardId}
        `
      } else {
        await sql`
          UPDATE user_cards SET nawed_count = nawed_count + 1
          WHERE id = ${userCardId}
        `
      }

      return Response.json({ success: true, action: 'added', reaction: reactionType })
    }

  } catch (error) {
    console.error('Error handling reaction:', error)
    return Response.json({ error: 'Failed to handle reaction' }, { status: 500 })
  }
}