import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CATEGORIES } from '@/app/lib/constants'

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

async function checkYouTubeEmbeddable(videoLink) {
  const videoId = getYouTubeId(videoLink)
  if (!videoId) return { embeddable: false, reason: 'Not a valid YouTube URL' }

  try {
    // Use YouTube oEmbed API to check embeddability
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )

    if (response.ok) {
      return { embeddable: true }
    } else {
      return { embeddable: false, reason: 'Video cannot be embedded (blocked by owner or copyright)' }
    }
  } catch (error) {
    // If oEmbed fails, video likely can't be embedded
    return { embeddable: false, reason: 'Video embedding check failed' }
  }
}

// Parse ISO 8601 duration (e.g., "PT5M30S") to seconds
function parseYouTubeDuration(duration) {
  if (!duration) return null
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null

  const hours = parseInt(match[1] || 0)
  const minutes = parseInt(match[2] || 0)
  const seconds = parseInt(match[3] || 0)

  return hours * 3600 + minutes * 60 + seconds
}

async function getYouTubeDuration(videoLink) {
  const videoId = getYouTubeId(videoLink)
  if (!videoId) return null

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.warn('YouTube API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const duration = data.items[0].contentDetails?.duration
        return parseYouTubeDuration(duration)
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching YouTube duration:', error)
    return null
  }
}

export async function POST(request) {
  try {
    const { videoLink, category, hashtags, email, journal } = await request.json()

    if (!videoLink || !category) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Check if it's a YouTube video and if it's embeddable
    const videoId = getYouTubeId(videoLink)
    let durationSeconds = null

    if (videoId) {
      const embedCheck = await checkYouTubeEmbeddable(videoLink)
      if (!embedCheck.embeddable) {
        return Response.json({
          error: embedCheck.reason || 'This video cannot be embedded'
        }, { status: 400 })
      }

      // Fetch video duration
      durationSeconds = await getYouTubeDuration(videoLink)
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)
    const submittedByUserId = session?.user?.id || null

    // Check for duplicate
    const existing = await sql`
      SELECT id FROM submissions WHERE video_link = ${videoLink}
    `
    if (existing.rows.length > 0) {
      return Response.json({ error: 'This video has already been submitted' }, { status: 400 })
    }

    await sql`
      INSERT INTO submissions (video_link, category, hashtags, email, approved, submitted_by_user_id, duration_seconds)
      VALUES (${videoLink}, ${category}, ${hashtags || ''}, ${email || ''}, false, ${submittedByUserId}, ${durationSeconds})
    `

    // TODO: Store journal text when submissions table is updated with journal_text column

    return Response.json({ success: true })

  } catch (error) {
    console.error('Submit error:', error)
    return Response.json({ error: 'Failed to submit' }, { status: 500 })
  }
}