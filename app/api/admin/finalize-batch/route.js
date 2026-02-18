import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const { batchDate } = await request.json()
    const date = batchDate || new Date().toISOString().split('T')[0]

    // Get all URLs from this batch
    const batch = await sql`
      SELECT video_link, category, youtube_title
      FROM curation_batches
      WHERE batch_date = ${date}
    `

    if (batch.rows.length === 0) {
      return Response.json({ error: 'No batch found for this date' }, { status: 404 })
    }

    let rejected = 0
    let kept = 0

    for (const row of batch.rows) {
      // Check if this URL still exists in submissions
      const exists = await sql`
        SELECT id FROM submissions WHERE video_link = ${row.video_link}
      `

      if (exists.rows.length === 0) {
        // URL was deleted = rejected
        await sql`
          INSERT INTO rejected_videos (video_link, category, youtube_title)
          VALUES (${row.video_link}, ${row.category}, ${row.youtube_title})
          ON CONFLICT (video_link) DO NOTHING
        `
        rejected++
      } else {
        kept++
      }
    }

    return Response.json({
      success: true,
      date,
      total: batch.rows.length,
      kept,
      rejected
    })

  } catch (error) {
    console.error('Finalize batch error:', error)
    return Response.json({ error: 'Failed to finalize batch' }, { status: 500 })
  }
}
