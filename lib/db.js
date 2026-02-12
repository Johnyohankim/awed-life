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
// Daily cards (8 cards per day, one per category)
export async function createDailyCardsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS daily_cards (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        category TEXT NOT NULL,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(date, category)
      )
    `
    console.log('Daily cards table ready')
  } catch (error) {
    console.error('Error creating daily_cards table:', error)
    throw error
  }
}

// Shown cards (tracks which videos each user has seen)
export async function createShownCardsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS shown_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        shown_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, submission_id)
      )
    `
    console.log('Shown cards table ready')
  } catch (error) {
    console.error('Error creating shown_cards table:', error)
    throw error
  }
}

// Helper: Get available cards for a category (not yet seen by user)
export async function getAvailableCardForCategory(category, userId) {
  try {
    const result = await sql`
      SELECT s.* FROM submissions s
      WHERE s.category = ${category}
      AND s.approved = true
      AND s.id NOT IN (
        SELECT submission_id FROM shown_cards 
        WHERE user_id = ${userId}
      )
      ORDER BY RANDOM()
      LIMIT 1
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting available card:', error)
    throw error
  }
}

// Helper: Get count of available cards per category
export async function getAvailableCardCounts() {
  try {
    const result = await sql`
      SELECT 
        category,
        COUNT(*) as total_approved,
        COUNT(*) as available
      FROM submissions
      WHERE approved = true
      GROUP BY category
      ORDER BY category
    `
    return result.rows
  } catch (error) {
    console.error('Error getting card counts:', error)
    throw error
  }
}

// Helper: Get today's daily cards
export async function getTodaysDailyCards(date) {
  try {
    const result = await sql`
      SELECT dc.*, s.video_link, s.category, s.hashtags
      FROM daily_cards dc
      LEFT JOIN submissions s ON dc.submission_id = s.id
      WHERE dc.date = ${date}
      ORDER BY dc.category
    `
    return result.rows
  } catch (error) {
    console.error('Error getting today\'s cards:', error)
    throw error
  }
}

// Helper: Assign daily cards for today
export async function assignDailyCards(date, userId) {
  const categories = [
    'moral-beauty',
    'collective-effervescence', 
    'nature',
    'music',
    'visual-design',
    'spirituality',
    'life-death',
    'epiphany'
  ]

  try {
    for (const category of categories) {
      // Check if card already assigned for today
      const existing = await sql`
        SELECT * FROM daily_cards 
        WHERE date = ${date} AND category = ${category}
      `

      if (existing.rows.length === 0) {
        // Get random approved card not yet shown
        const card = await getAvailableCardForCategory(category, userId)

        await sql`
          INSERT INTO daily_cards (date, category, submission_id)
          VALUES (${date}, ${category}, ${card ? card.id : null})
          ON CONFLICT (date, category) DO NOTHING
        `
      }
    }
  } catch (error) {
    console.error('Error assigning daily cards:', error)
    throw error
  }
}

export async function createMomentReactionsTable() {
  try {
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
    console.log('Moment reactions table ready')
  } catch (error) {
    console.error('Error creating moment_reactions table:', error)
    throw error
  }
}