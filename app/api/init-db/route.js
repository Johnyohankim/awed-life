import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    // Existing tables
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        video_link TEXT NOT NULL,
        category TEXT NOT NULL,
        hashtags TEXT,
        email TEXT,
        approved BOOLEAN DEFAULT false,
        submitted_at TIMESTAMP DEFAULT NOW(),
        submitted_by_user_id INTEGER
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT,
        google_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        timezone TEXT,
        streak_count INTEGER DEFAULT 0,
        last_card_date DATE,
        submission_points INTEGER DEFAULT 0
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS user_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        journal_text TEXT,
        is_public BOOLEAN DEFAULT false,
        kept_at TIMESTAMP DEFAULT NOW(),
        awed_count INTEGER DEFAULT 0,
        nawed_count INTEGER DEFAULT 0,
        is_submission BOOLEAN DEFAULT false
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_card_id INTEGER REFERENCES user_cards(id) ON DELETE CASCADE,
        reaction_type TEXT CHECK (reaction_type IN ('awed', 'nawed')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, user_card_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS daily_card_state (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        flipped_cards JSONB DEFAULT '[]',
        kept_card_category TEXT,
        UNIQUE(user_id, date)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS daily_cards (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        category TEXT NOT NULL,
        submission_id INTEGER REFERENCES submissions(id),
        UNIQUE(date, category)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS shown_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        shown_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, submission_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS moment_reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        reaction_type TEXT CHECK (reaction_type IN ('awed', 'nawed')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, submission_id)
      )
    `

    // Add new columns if they don't exist yet (safe migrations)
    await sql`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS submitted_by_user_id INTEGER REFERENCES users(id)
    `

    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS submission_points INTEGER DEFAULT 0
    `

    await sql`
      ALTER TABLE user_cards 
      ADD COLUMN IF NOT EXISTS is_submission BOOLEAN DEFAULT false
    `

    return Response.json({
      success: true,
      message: 'All database tables initialized and migrated!'
    })

  } catch (error) {
    console.error('Database init error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}