import { sql } from '@vercel/postgres'
import Anthropic from '@anthropic-ai/sdk'

const VALID_CATEGORIES = [
  'moral-beauty',
  'collective-effervescence',
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Extract YouTube video ID from URL
 */
function getYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

/**
 * Fetch YouTube video title using YouTube Data API
 */
async function getYouTubeTitle(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
    )
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title
    }
  } catch (error) {
    console.error('Error fetching YouTube title:', error)
  }
  return null
}

/**
 * Generate hashtags using Claude based on video title and category
 */
async function generateHashtags(title, category) {
  if (!title) return ''

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate 3-5 relevant hashtags for this ${category} video: "${title}"

Rules:
- Hashtags should be lowercase, single words or hyphenated phrases
- Focus on key themes, subjects, or emotions
- Be specific and descriptive
- Separate with commas
- No # symbol

Example: aurora, timelapse, iceland, northern-lights, nature-phenomenon

Output only the hashtags, nothing else.`
      }]
    })

    const hashtags = message.content[0].text.trim()
    return hashtags
  } catch (error) {
    console.error('Error generating hashtags:', error)
    return ''
  }
}

export async function POST(request) {
  try {
    const { urls, category } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return Response.json({ error: 'No URLs provided' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 })
    }

    let added = 0
    let skipped = 0
    let errors = []

    for (const url of urls) {
      const trimmed = url.trim()
      if (!trimmed) continue

      try {
        // Check for duplicate
        const existing = await sql`
          SELECT id FROM submissions WHERE video_link = ${trimmed}
        `

        if (existing.rows.length > 0) {
          skipped++
          continue
        }

        // Extract YouTube ID and fetch title
        const videoId = getYouTubeId(trimmed)
        let hashtags = ''

        if (videoId) {
          const title = await getYouTubeTitle(videoId)
          if (title) {
            hashtags = await generateHashtags(title, category)
            console.log(`Generated hashtags for "${title}": ${hashtags}`)
          }
        }

        // Insert as approved with generated hashtags
        await sql`
          INSERT INTO submissions (video_link, category, hashtags, email, approved)
          VALUES (${trimmed}, ${category}, ${hashtags}, 'admin-bulk', true)
        `
        added++
      } catch (error) {
        console.error(`Error processing ${trimmed}:`, error)
        errors.push({ url: trimmed, error: error.message })
      }
    }

    return Response.json({
      success: true,
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Bulk submit error:', error)
    return Response.json({ error: 'Failed to bulk submit' }, { status: 500 })
  }
}