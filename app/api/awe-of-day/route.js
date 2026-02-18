import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Pick a random approved submission, seeded by day so it's stable for 24h
    const randomResult = await sql`
      SELECT id, video_link, category
      FROM submissions
      WHERE approved = true
      ORDER BY MD5(id::text || ${today})
      LIMIT 1
    `

    if (randomResult.rows.length === 0) {
      return Response.json({ moment: null })
    }

    let picked = { ...randomResult.rows[0], awed_count: 0 }
    let source = 'random'

    // If someone got awed reactions today, show that instead
    const topAwedResult = await sql`
      SELECT
        s.id,
        s.video_link,
        s.category,
        COUNT(mr.id) as awed_count
      FROM submissions s
      JOIN moment_reactions mr ON s.id = mr.submission_id
      WHERE mr.reaction_type = 'awed'
        AND s.approved = true
        AND mr.created_at::date = ${today}::date
      GROUP BY s.id, s.video_link, s.category
      ORDER BY awed_count DESC, s.id DESC
      LIMIT 1
    `

    if (topAwedResult.rows.length > 0) {
      const row = topAwedResult.rows[0]
      picked = {
        id: row.id,
        video_link: row.video_link,
        category: row.category,
        awed_count: parseInt(row.awed_count)
      }
      source = 'awed'
    }

    return Response.json({ moment: picked, source })

  } catch (error) {
    console.error('Error fetching awe of day:', error)
    return Response.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
