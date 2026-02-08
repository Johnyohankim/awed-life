import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const result = await sql`
      SELECT id, video_link, category
      FROM submissions
      WHERE approved = true
      ORDER BY submitted_at DESC
      LIMIT 8
    `
    
    const submissions = result.rows.map(row => ({
      id: row.id,
      videoLink: row.video_link,
      category: row.category
    }))
    
    return Response.json({ submissions })
    
  } catch (error) {
    console.error('Error fetching recent submissions:', error)
    return Response.json({ submissions: [] }, { status: 500 })
  }
}