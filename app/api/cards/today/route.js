import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'

const categories = [
  'moral-beauty',
  'collective-effervescence',
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

const categoryColors = {
  'moral-beauty': 'from-rose-400 to-pink-600',
  'collective-effervescence': 'from-orange-400 to-red-600',
  'nature': 'from-green-400 to-emerald-600',
  'music': 'from-purple-400 to-violet-600',
  'visual-design': 'from-blue-400 to-cyan-600',
  'spirituality': 'from-amber-400 to-yellow-600',
  'life-death': 'from-slate-400 to-gray-600',
  'epiphany': 'from-indigo-400 to-blue-600'
}

const categoryLabels = {
  'moral-beauty': 'Moral Beauty',
  'collective-effervescence': 'Collective Effervescence',
  'nature': 'Nature',
  'music': 'Music',
  'visual-design': 'Visual Design',
  'spirituality': 'Spirituality & Religion',
  'life-death': 'Life & Death',
  'epiphany': 'Epiphany'
}

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (userResult.rows.length === 0) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].id

    // Get today's date in user's timezone (simplified - using UTC for now)
    const today = new Date().toISOString().split('T')[0]

    // Get user's kept card for today
    const keptResult = await sql`
      SELECT uc.*, s.category
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
      AND DATE(uc.kept_at) = ${today}
    `

    const keptCard = keptResult.rows[0] || null

    // Get user's flipped cards for today
    const flippedResult = await sql`
      SELECT submission_id
      FROM daily_card_state
      WHERE user_id = ${userId}
      AND date = ${today}
    `

    const flippedCards = flippedResult.rows[0]?.flipped_cards || []

    // Build cards for each category
    const cards = []

    for (const category of categories) {
      // Check if user already kept a card in this category
      const alreadyKept = await sql`
        SELECT uc.id 
        FROM user_cards uc
        JOIN submissions s ON uc.submission_id = s.id
        WHERE uc.user_id = ${userId}
        AND s.category = ${category}
        AND DATE(uc.kept_at) = ${today}
      `

      // Get a video for this category not yet seen by user
      const videoResult = await sql`
        SELECT s.*
        FROM submissions s
        WHERE s.category = ${category}
        AND s.approved = true
        AND s.id NOT IN (
          SELECT submission_id FROM shown_cards
          WHERE user_id = ${userId}
        )
        ORDER BY RANDOM()
        LIMIT 1
      `

      const video = videoResult.rows[0] || null

      cards.push({
        category,
        label: categoryLabels[category],
        color: categoryColors[category],
        video: video ? {
          id: video.id,
          videoLink: video.video_link,
          hashtags: video.hashtags
        } : null,
        isEmpty: !video,
        isKept: alreadyKept.rows.length > 0,
        isFlipped: flippedCards.includes(video?.id)
      })
    }

    return Response.json({
      cards,
      keptCard,
      today
    })

  } catch (error) {
    console.error('Error getting today\'s cards:', error)
    return Response.json(
      { error: 'Failed to get cards' },
      { status: 500 }
    )
  }
}