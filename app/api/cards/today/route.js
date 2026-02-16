import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '@/app/lib/constants'

/**
 * Calculate user's preference weights for each category
 * Based on their reaction history: love=3 points, like=2 points, neutral=1 point
 */
async function getCategoryPreferences(userId) {
  try {
    const reactions = await sql`
      SELECT
        s.category,
        ae.event_name,
        COUNT(*) as count
      FROM analytics_events ae
      JOIN submissions s ON (ae.metadata->>'submissionId')::int = s.id
      WHERE ae.user_id = ${userId}
        AND ae.event_name IN ('reaction_love', 'reaction_like', 'reaction_neutral')
      GROUP BY s.category, ae.event_name
    `

    // Calculate weights (love=3, like=2, neutral=1)
    const weights = {}
    CATEGORIES.forEach(cat => weights[cat] = 1) // baseline weight

    reactions.rows.forEach(row => {
      const points = row.event_name === 'reaction_love' ? 3
                   : row.event_name === 'reaction_like' ? 2
                   : 1
      weights[row.category] = (weights[row.category] || 1) + (points * parseInt(row.count))
    })

    // Normalize to preference scores (0-100)
    const maxWeight = Math.max(...Object.values(weights))
    const preferences = {}
    CATEGORIES.forEach(cat => {
      preferences[cat] = Math.round((weights[cat] / maxWeight) * 100)
    })

    return preferences
  } catch (error) {
    console.error('Error calculating preferences:', error)
    // Return baseline preferences if error
    const baseline = {}
    CATEGORIES.forEach(cat => baseline[cat] = 50)
    return baseline
  }
}

/**
 * Get content-based preferences: hashtags from videos user loved
 * Returns weighted hashtag map for similarity scoring
 */
async function getUserContentPreferences(userId) {
  try {
    const lovedVideos = await sql`
      SELECT s.hashtags, ae.event_name
      FROM analytics_events ae
      JOIN submissions s ON (ae.metadata->>'submissionId')::int = s.id
      WHERE ae.user_id = ${userId}
        AND ae.event_name IN ('reaction_love', 'reaction_like')
        AND s.hashtags IS NOT NULL
        AND s.hashtags != ''
    `

    // Build weighted hashtag map (love=3, like=2)
    const hashtagWeights = {}
    lovedVideos.rows.forEach(row => {
      const weight = row.event_name === 'reaction_love' ? 3 : 2
      const hashtags = row.hashtags.split(',').map(tag => tag.trim().toLowerCase())

      hashtags.forEach(tag => {
        if (tag) {
          hashtagWeights[tag] = (hashtagWeights[tag] || 0) + weight
        }
      })
    })

    return hashtagWeights
  } catch (error) {
    console.error('Error getting content preferences:', error)
    return {}
  }
}

/**
 * Calculate similarity score between video and user's content preferences
 * Based on hashtag overlap
 */
function calculateContentSimilarity(videoHashtags, userHashtagWeights) {
  if (!videoHashtags || Object.keys(userHashtagWeights).length === 0) {
    return 0
  }

  const tags = videoHashtags.split(',').map(tag => tag.trim().toLowerCase())
  let similarityScore = 0

  tags.forEach(tag => {
    if (userHashtagWeights[tag]) {
      similarityScore += userHashtagWeights[tag]
    }
  })

  return similarityScore
}

async function generateDailyCards(today, userId) {
  // Get user's content preferences once for all categories
  const userHashtagWeights = await getUserContentPreferences(userId)
  const hasContentPreferences = Object.keys(userHashtagWeights).length > 0

  for (const category of CATEGORIES) {
    try {
      const existing = await sql`
        SELECT id FROM daily_cards WHERE date = ${today} AND category = ${category}
      `
      if (existing.rows.length > 0) continue

      // Get candidate videos with content-based scoring
      let candidates
      try {
        // Fetch top candidates with hashtags for similarity scoring
        candidates = await sql`
          SELECT s.id, s.hashtags, s.duration_seconds
          FROM submissions s
          WHERE s.category = ${category}
            AND s.approved = true
            AND s.id NOT IN (
              SELECT submission_id FROM shown_cards WHERE user_id = ${userId}
            )
          ORDER BY
            CASE
              WHEN s.duration_seconds IS NOT NULL AND s.duration_seconds BETWEEN 15 AND 300 THEN 0
              WHEN s.duration_seconds IS NULL THEN 1
              ELSE 2
            END,
            RANDOM()
          LIMIT 20
        `
      } catch (durationError) {
        // Fallback without duration column
        candidates = await sql`
          SELECT s.id, s.hashtags
          FROM submissions s
          WHERE s.category = ${category}
            AND s.approved = true
            AND s.id NOT IN (
              SELECT submission_id FROM shown_cards WHERE user_id = ${userId}
            )
          ORDER BY RANDOM()
          LIMIT 20
        `
      }

      let selectedVideo = null

      if (candidates.rows.length > 0) {
        if (hasContentPreferences) {
          // Score candidates by content similarity
          const scoredCandidates = candidates.rows.map(video => ({
            id: video.id,
            similarityScore: calculateContentSimilarity(video.hashtags, userHashtagWeights)
          }))

          // Sort by similarity score (highest first)
          scoredCandidates.sort((a, b) => b.similarityScore - a.similarityScore)

          // Pick from top 3 randomly (to maintain some variety)
          const topCandidates = scoredCandidates.slice(0, 3)
          selectedVideo = topCandidates[Math.floor(Math.random() * topCandidates.length)]
        } else {
          // No content preferences yet, pick random from candidates
          selectedVideo = candidates.rows[Math.floor(Math.random() * candidates.rows.length)]
        }
      }

      let result = selectedVideo ? { rows: [{ id: selectedVideo.id }] } : { rows: [] }

      if (result.rows.length === 0) {
        // Try fallback with all videos in category (content-based)
        let fallbackCandidates
        try {
          fallbackCandidates = await sql`
            SELECT id, hashtags, duration_seconds
            FROM submissions
            WHERE category = ${category} AND approved = true
            ORDER BY
              CASE
                WHEN duration_seconds IS NOT NULL AND duration_seconds BETWEEN 15 AND 300 THEN 0
                WHEN duration_seconds IS NULL THEN 1
                ELSE 2
              END,
              RANDOM()
            LIMIT 20
          `
        } catch (durationError) {
          fallbackCandidates = await sql`
            SELECT id, hashtags
            FROM submissions
            WHERE category = ${category} AND approved = true
            ORDER BY RANDOM()
            LIMIT 20
          `
        }

        if (fallbackCandidates.rows.length > 0) {
          let fallbackVideo

          if (hasContentPreferences) {
            // Score by similarity
            const scored = fallbackCandidates.rows.map(v => ({
              id: v.id,
              score: calculateContentSimilarity(v.hashtags, userHashtagWeights)
            }))
            scored.sort((a, b) => b.score - a.score)
            const top = scored.slice(0, 3)
            fallbackVideo = top[Math.floor(Math.random() * top.length)]
          } else {
            fallbackVideo = fallbackCandidates.rows[Math.floor(Math.random() * fallbackCandidates.rows.length)]
          }

          await sql`
            INSERT INTO daily_cards (date, category, submission_id)
            VALUES (${today}, ${category}, ${fallbackVideo.id})
            ON CONFLICT (date, category) DO NOTHING
          `
        }
      } else {
        await sql`
          INSERT INTO daily_cards (date, category, submission_id)
          VALUES (${today}, ${category}, ${result.rows[0].id})
          ON CONFLICT (date, category) DO NOTHING
        `
        await sql`
          INSERT INTO shown_cards (user_id, submission_id)
          VALUES (${userId}, ${result.rows[0].id})
          ON CONFLICT DO NOTHING
        `
      }
    } catch (error) {
      console.error(`Error generating daily card for ${category}:`, error)
      // Continue with next category even if this one fails
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // Get user's category preferences (for recommendation engine)
    const categoryPreferences = await getCategoryPreferences(userId)

    // Get today's daily card state
    const stateResult = await sql`
      SELECT flipped_cards, kept_card_category
      FROM daily_card_state
      WHERE user_id = ${userId} AND date = ${today}
    `
    const state = stateResult.rows[0] || { flipped_cards: [], kept_card_category: null }
    const keptCardCategory = state.kept_card_category

    // Get/generate today's daily cards
    let dailyCardsResult = await sql`
      SELECT dc.category, dc.submission_id, s.video_link
      FROM daily_cards dc
      JOIN submissions s ON dc.submission_id = s.id
      WHERE dc.date = ${today}
    `
    if (dailyCardsResult.rows.length < 8) {
      await generateDailyCards(today, userId)
      dailyCardsResult = await sql`
        SELECT dc.category, dc.submission_id, s.video_link
        FROM daily_cards dc
        JOIN submissions s ON dc.submission_id = s.id
        WHERE dc.date = ${today}
      `
    }
    const dailyCards = dailyCardsResult.rows

    // Build 8 curated cards with preference scores
    const cards = CATEGORIES.map(category => {
      const dailyCard = dailyCards.find(dc => dc.category === category)
      const isKept = keptCardCategory === category
      const preferenceScore = categoryPreferences[category] || 50

      if (!dailyCard) {
        return {
          category,
          label: CATEGORY_LABELS[category],
          color: CATEGORY_COLORS[category],
          isEmpty: true,
          isKept: false,
          video: null,
          preferenceScore
        }
      }

      return {
        category,
        label: CATEGORY_LABELS[category],
        color: CATEGORY_COLORS[category],
        isEmpty: false,
        isKept,
        video: {
          id: dailyCard.submission_id,
          videoLink: dailyCard.video_link
        },
        preferenceScore
      }
    })

    // Sort cards by preference score (highest first) for personalized ordering
    cards.sort((a, b) => b.preferenceScore - a.preferenceScore)

    // Get curated kept card for today
    const keptResult = await sql`
      SELECT uc.submission_id, s.category
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
        AND DATE(uc.kept_at) = ${today}
        AND uc.is_submission = false
      LIMIT 1
    `
    const keptCard = keptResult.rows[0] || null

    // Get submission slots - user's approved submissions auto-added to collection
    const submissionSlotsResult = await sql`
      SELECT 
        uc.id as card_id,
        uc.journal_text,
        uc.is_submission,
        s.id as submission_id,
        s.video_link,
        s.category,
        uc.kept_at
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
        AND uc.is_submission = true
      ORDER BY uc.kept_at DESC
    `

    // Get user submission points
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

    // Get categories kept today
    const keptCategoriesResult = await sql`
      SELECT DISTINCT s.category
      FROM user_cards uc
      JOIN submissions s ON uc.submission_id = s.id
      WHERE uc.user_id = ${userId}
        AND DATE(uc.kept_at) = ${today}
        AND uc.is_submission = false
    `
    const keptCategories = keptCategoriesResult.rows.map(row => row.category)

    // Get top 3 favorite categories for insights
    const sortedPreferences = Object.entries(categoryPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, score]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        score
      }))

    return Response.json({
      cards,
      keptCard,
      submissionSlots: submissionSlotsResult.rows,
      submissionPoints,
      keptToday,
      allowedKeeps,
      keptCategories,
      recommendations: {
        enabled: true,
        topCategories: sortedPreferences,
        message: sortedPreferences.length > 0
          ? `Cards ordered by your preferences`
          : `Discovering your preferences...`
      }
    })

  } catch (error) {
    console.error('Cards API error:', error)
    return Response.json({ error: 'Failed to load cards' }, { status: 500 })
  }
}