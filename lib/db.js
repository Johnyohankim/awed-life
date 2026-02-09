import { sql } from '@vercel/postgres'

export async function createSubmissionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        video_link TEXT NOT NULL,
        category TEXT NOT NULL,
        hashtags TEXT,
        email TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW(),
        approved BOOLEAN DEFAULT FALSE
      )
    `
    console.log('Submissions table ready')
  } catch (error) {
    console.error('Error creating table:', error)
  }
}

export async function addSubmission(videoLink, category, hashtags, email) {
  const result = await sql`
    INSERT INTO submissions (video_link, category, hashtags, email)
    VALUES (${videoLink}, ${category}, ${hashtags}, ${email})
    RETURNING *
  `
  return result.rows[0]
}

export async function getSubmissions() {
  const result = await sql`
    SELECT * FROM submissions
    ORDER BY submitted_at DESC
  `
  return result.rows
}

export async function updateSubmissionStatus(id, approved) {
  const result = await sql`
    UPDATE submissions
    SET approved = ${approved}
    WHERE id = ${id}
    RETURNING *
  `
  return result.rows[0]
}

export async function deleteSubmission(id) {
  await sql`
    DELETE FROM submissions
    WHERE id = ${id}
  `
}

// User management
export async function createUsersTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT,
        google_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        timezone TEXT DEFAULT 'UTC',
        streak_count INTEGER DEFAULT 0,
        last_card_date DATE
      )
    `
    console.log('Users table ready')
  } catch (error) {
    console.error('Error creating users table:', error)
  }
}

// User cards collection
export async function createUserCardsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        journal_text TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        kept_at TIMESTAMP DEFAULT NOW(),
        awed_count INTEGER DEFAULT 0,
        nawed_count INTEGER DEFAULT 0,
        UNIQUE(user_id, submission_id)
      )
    `
    console.log('User cards table ready')
  } catch (error) {
    console.error('Error creating user_cards table:', error)
  }
}

// Reactions (awed/nawed)
export async function createReactionsTable() {
  try {
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
    console.log('Reactions table ready')
  } catch (error) {
    console.error('Error creating reactions table:', error)
  }
}

// Daily card state (tracks which cards user has flipped today)
export async function createDailyCardStateTable() {
  try {
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
    console.log('Daily card state table ready')
  } catch (error) {
    console.error('Error creating daily_card_state table:', error)
  }
}