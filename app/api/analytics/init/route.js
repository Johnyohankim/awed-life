import { sql } from '@vercel/postgres'

// Run this once to create the analytics_events table
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        user_id INTEGER,
        session_id VARCHAR(255),
        properties JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at)
    `

    return Response.json({ success: true, message: 'Analytics table created' })
  } catch (error) {
    console.error('Error creating analytics table:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
