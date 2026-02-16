import { sql } from '@vercel/postgres'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const { eventName, properties = {} } = await request.json()

    if (!eventName) {
      return Response.json({ error: 'eventName required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Get or create session ID from properties
    const sessionId = properties.sessionId || null

    await sql`
      INSERT INTO analytics_events (event_name, user_id, session_id, properties)
      VALUES (${eventName}, ${userId}, ${sessionId}, ${JSON.stringify(properties)})
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Don't fail user requests if analytics fails
    return Response.json({ success: false }, { status: 200 })
  }
}
