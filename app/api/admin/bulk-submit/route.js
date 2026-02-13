import { sql } from '@vercel/postgres'

const VALID_CATEGORIES = [
  'moral-beauty',
  'collective-effervescence',
  'nature',
  'music',
  'visual-design',
  'spirituality',
  'life-death',
  'epiphany'
]

export async function POST(request) {
  try {
    const { urls, category } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return Response.json({ error: 'No URLs provided' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 })
    }

    let added = 0
    let skipped = 0

    for (const url of urls) {
      const trimmed = url.trim()
      if (!trimmed) continue

      // Check for duplicate
      const existing = await sql`
        SELECT id FROM submissions WHERE video_link = ${trimmed}
      `

      if (existing.rows.length > 0) {
        skipped++
        continue
      }

      // Insert as approved
      await sql`
        INSERT INTO submissions (video_link, category, hashtags, email, approved)
        VALUES (${trimmed}, ${category}, '', 'admin-bulk', true)
      `
      added++
    }

    return Response.json({ success: true, added, skipped })

  } catch (error) {
    console.error('Bulk submit error:', error)
    return Response.json({ error: 'Failed to bulk submit' }, { status: 500 })
  }
}