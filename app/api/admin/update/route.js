import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const { id, action, category } = await request.json()

    if (action === 'approve') {
      await sql`UPDATE submissions SET approved = true WHERE id = ${id}`
    } else if (action === 'unapprove') {
      await sql`UPDATE submissions SET approved = false WHERE id = ${id}`
    } else if (action === 'reject') {
      await sql`DELETE FROM submissions WHERE id = ${id}`
    } else if (action === 'update-category') {
      if (!category) {
        return Response.json({ error: 'Category required' }, { status: 400 })
      }
      await sql`UPDATE submissions SET category = ${category} WHERE id = ${id}`
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error('Admin update error:', error)
    return Response.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}