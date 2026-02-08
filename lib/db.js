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