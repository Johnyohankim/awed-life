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

    // Add journal_text column to submissions table
    await sql`
      ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS journal_text TEXT
    `

    return Response.json({
      success: true,
      message: 'Journal column added successfully'
    })

  } catch (error) {
    console.error('Error adding journal column:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
