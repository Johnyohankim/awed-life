import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const { videoLink, category, hashtags, email } = await request.json()

    if (!videoLink || !category) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
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
      INSERT INTO submissions (video_link, category, hashtags, email, approved, submitted_by_user_id)
      VALUES (${videoLink}, ${category}, ${hashtags || ''}, ${email || ''}, false, ${submittedByUserId})
    `

    return Response.json({ success: true })

  } catch (error) {
    console.error('Submit error:', error)
    return Response.json({ error: 'Failed to submit' }, { status: 500 })
  }
}