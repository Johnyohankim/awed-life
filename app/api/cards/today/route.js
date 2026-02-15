import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const CATEGORIES = [
  'moral-beauty',
  'collective-effervescence', 
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // Get user's submission points
    const userResult = await sql`
      SELECT submission_points FROM users WHERE id = ${userId}
    `
    const submissionPoints = userResult.rows[0]?.submission_points || 0
    const allowedKeeps = Math.min(1 + submissionPoints, 8)

    // Get cards kept today (excluding submission cards)
    const keptTodayResult = await sql`
      SELECT COUNT(*) as count
      FROM user_cards
      WHERE user_id = ${userId}
        AND DATE(kept_at) = ${today}
        AND is_submission = false
    `
    const keptToday = parseInt(keptTodayResult.rows[0]?.count || 0)

    // Get today's cards for each category
    const dailyCardsResult = await sql`
      SELECT category, submission_id 
      FROM daily_cards 
      WHERE date = ${today}
    `

    // Get user's flipped cards today
    const stateResult = await sql`
      SELECT flipped_cards FROM daily_card_state
      WHERE user_id = ${userId} AND date = ${today}
    `
    const flippedCards = stateResult.rows[0]?.flipped_cards || []

    // Get cards user has already seen (to exclude)
    const shownResult = await sql`
      SELECT submission_id FROM shown_cards WHERE user_id = ${userId}
    `
    const shownIds = shownResult.rows.map(r => r.submission_id)

    // Build cards for each category
    const cards = []
    
    for (const category of CATEGORIES) {
      const dailyCard = dailyCardsResult.rows.find(r => r.category === category)
      
      if (dailyCard?.submission_id) {
        // Get submission details
        const submissionResult = await sql`
          SELECT id, video_link, category, approved
          FROM submissions
          WHERE id = ${dailyCard.submission_id} AND approved = true
        `

        if (submissionResult.rows.length > 0) {
          const submission = submissionResult.rows[0]
          
          // Check if user already kept this
          const keptResult = await sql`
            SELECT id FROM user_cards
            WHERE user_id = ${userId} AND submission_id = ${submission.id}
          `

          cards.push({
            category,
            label: category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            color: getCategoryColor(category),
            video: submission,
            isFlipped: flippedCards.includes(category),
            isKept: keptResult.rows.length > 0,
            isEmpty: false
          })
        } else {
          cards.push(createEmptyCard(category))
        }
      } else {
        // No daily card assigned - find a random approved one
        let randomResult
        if (shownIds.length > 0) {
          randomResult = await sql`
            SELECT id, video_link, category
            FROM submissions
            WHERE category = ${category} 
              AND approved = true
              AND id NOT IN (
                SELECT submission_id FROM user_cards WHERE user_id = ${userId}
              )
              AND id NOT IN (${sql.join(shownIds.map(id => sql`${id}`), sql`, `)})
            ORDER BY RANDOM()
            LIMIT 1
          `
        } else {
          randomResult = await sql`
            SELECT id, video_link, category
            FROM submissions
            WHERE category = ${category} 
              AND approved = true
              AND id NOT IN (
                SELECT submission_id FROM user_cards WHERE user_id = ${userId}
              )
            ORDER BY RANDOM()
            LIMIT 1
          `
        }

        if (randomResult.rows.length > 0) {
          const submission = randomResult.rows[0]
          cards.push({
            category,
            label: category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            color: getCategoryColor(category),
            video: submission,
            isFlipped: flippedCards.includes(category),
            isKept: false,
            isEmpty: false
          })
        } else {
          cards.push(createEmptyCard(category))
        }
      }
    }

    // Get user's submission slots (approved submissions)
    const submissionSlotsResult = await sql`
      SELECT 
        s.id as submission_id,
        s.category,
        s.video_link,
        uc.id as card_id
      FROM submissions s
      LEFT JOIN user_cards uc ON uc.submission_id = s.id AND uc.user_id = ${userId}
      WHERE s.submitted_by_user_id = ${userId}
        AND s.approved = true
      ORDER BY s.submitted_at DESC
    `

    return Response.json({
      cards,
      submissionSlots: submissionSlotsResult.rows,
      submissionPoints,
      keptToday,
      allowedKeeps
    })

  } catch (error) {
    console.error('Error getting today\'s cards:', error)
    return Response.json({ error: 'Failed to get cards' }, { status: 500 })
  }
}

function getCategoryColor(category) {
  const colors = {
    'moral-beauty': 'from-rose-400 to-pink-600',
    'collective-effervescence': 'from-orange-400 to-red-600',
    'nature': 'from-green-400 to-emerald-600',
    'music': 'from-purple-400 to-violet-600',
    'visual-design': 'from-blue-400 to-cyan-600',
    'spirituality': 'from-amber-400 to-yellow-600',
    'life-death': 'from-slate-400 to-gray-600',
    'epiphany': 'from-indigo-400 to-blue-600'
  }
  return colors[category] || 'from-gray-400 to-gray-600'
}

function createEmptyCard(category) {
  return {
    category,
    label: category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    color: getCategoryColor(category),
    video: null,
    isFlipped: false,
    isKept: false,
    isEmpty: true
  }
}