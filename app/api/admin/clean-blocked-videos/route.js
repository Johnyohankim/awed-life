import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
  if (!videoId) return true // Not YouTube, allow it

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    )
    return response.ok
  } catch (error) {
    return false // If check fails, consider it blocked
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    // Admin check - only allow admin users
    if (!session?.user?.email || session.user.email !== 'letmeloveu2@gmail.com') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all YouTube submissions
    const submissions = await sql`
      SELECT id, video_link
      FROM submissions
      WHERE video_link LIKE '%youtube%' OR video_link LIKE '%youtu.be%'
    `

    const results = {
      total: submissions.rows.length,
      checked: 0,
      blocked: [],
      errors: []
    }

    // Check each video
    for (const submission of submissions.rows) {
      try {
        const isEmbeddable = await checkYouTubeEmbeddable(submission.video_link)
        results.checked++

        if (!isEmbeddable) {
          results.blocked.push({
            id: submission.id,
            url: submission.video_link
          })
        }
      } catch (error) {
        results.errors.push({
          id: submission.id,
          url: submission.video_link,
          error: error.message
        })
      }
    }

    // Remove blocked videos
    if (results.blocked.length > 0) {
      const blockedIds = results.blocked.map(b => b.id)
      await sql`
        DELETE FROM submissions
        WHERE id = ANY(${blockedIds})
      `
    }

    return Response.json({
      success: true,
      ...results,
      removed: results.blocked.length
    })

  } catch (error) {
    console.error('Error cleaning blocked videos:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
