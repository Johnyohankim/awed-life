import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')

    if (authCookie?.value !== 'true') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Add duration_seconds column to submissions table
    await sql`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS duration_seconds INTEGER
    `

    // Create index for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_duration ON submissions(duration_seconds)
    `

    return Response.json({
      success: true,
      message: 'Duration column added successfully'
    })

  } catch (error) {
    console.error('Error adding duration column:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
