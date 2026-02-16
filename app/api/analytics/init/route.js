import { sql } from '@vercel/postgres'

// Run this once to create the analytics_events table
export async function GET() {
  try {
    console.log('Starting analytics table creation...')

    // Create table
    console.log('Creating table...')
    const tableResult = await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        user_id INTEGER,
        session_id VARCHAR(255),
        properties JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('Table created:', tableResult)

    // Create indexes
    console.log('Creating event_name index...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name)
    `

    console.log('Creating user_id index...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id)
    `

    console.log('Creating created_at index...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at)
    `

    console.log('All indexes created successfully')
    return Response.json({ success: true, message: 'Analytics table created successfully' })
  } catch (error) {
    console.error('Error creating analytics table:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return Response.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}
