import { sql } from '@vercel/postgres'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')

    if (authCookie?.value !== 'true') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Delete orphaned daily_cards (where submission_id doesn't exist in submissions)
    const deleteOrphaned = await sql`
      DELETE FROM daily_cards
      WHERE submission_id NOT IN (SELECT id FROM submissions)
    `

    // Also delete today's cards to force regeneration
    const deleteToday = await sql`
      DELETE FROM daily_cards
      WHERE date = ${today}
    `

    return Response.json({
      success: true,
      orphanedDeleted: deleteOrphaned.rowCount || 0,
      todayDeleted: deleteToday.rowCount || 0,
      message: 'Daily cards cleaned and will regenerate on next visit'
    })

  } catch (error) {
    console.error('Error cleaning daily cards:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
