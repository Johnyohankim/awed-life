import { sql } from '@vercel/postgres'

// GET - list all users with stats
export async function GET() {
  try {
    const result = await sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.created_at,
        u.last_login,
        u.streak_count,
        u.submission_points,
        (SELECT COUNT(*) FROM user_cards WHERE user_id = u.id) as total_cards,
        (SELECT COUNT(*) FROM explore_keeps WHERE user_id = u.id) as total_walks,
        (SELECT COUNT(*) FROM submissions WHERE submitted_by_user_id = u.id AND approved = true) as approved_submissions,
        (SELECT COUNT(*) FROM reactions WHERE user_id = u.id) as total_reactions
      FROM users u
      ORDER BY u.created_at DESC
    `
    return Response.json({ users: result.rows })
  } catch (error) {
    console.error('Users GET error:', error)
    return Response.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

// PATCH - edit user
export async function PATCH(request) {
  try {
    const { id, name, email } = await request.json()
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${id}
    `
    return Response.json({ success: true })
  } catch (error) {
    console.error('Users PATCH error:', error)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE - delete user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    // ON DELETE CASCADE will handle related records
    await sql`DELETE FROM users WHERE id = ${id}`
    return Response.json({ success: true })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return Response.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}