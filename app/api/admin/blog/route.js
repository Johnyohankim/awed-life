import { sql } from '@vercel/postgres'

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// GET - list all posts (including drafts) for admin
export async function GET() {
  try {
    const result = await sql`
      SELECT id, title, slug, excerpt, published, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `
    return Response.json({ posts: result.rows })
  } catch (error) {
    return Response.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

// POST - create new post
export async function POST(request) {
  try {
    const { title, content, excerpt, published } = await request.json()
    if (!title || !content) {
      return Response.json({ error: 'Title and content required' }, { status: 400 })
    }

    const slug = generateSlug(title)

    // Check for duplicate slug
    const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug}`
    const finalSlug = existing.rows.length > 0 ? `${slug}-${Date.now()}` : slug

    const result = await sql`
      INSERT INTO blog_posts (title, slug, content, excerpt, published)
      VALUES (${title}, ${finalSlug}, ${content}, ${excerpt || ''}, ${published || false})
      RETURNING id, slug
    `
    return Response.json({ success: true, id: result.rows[0].id, slug: result.rows[0].slug })
  } catch (error) {
    console.error('Blog POST error:', error)
    return Response.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// PATCH - update existing post
export async function PATCH(request) {
  try {
    const { id, title, content, excerpt, published } = await request.json()
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    await sql`
      UPDATE blog_posts
      SET title = ${title}, content = ${content}, excerpt = ${excerpt || ''},
          published = ${published}, updated_at = NOW()
      WHERE id = ${id}
    `
    return Response.json({ success: true })
  } catch (error) {
    console.error('Blog PATCH error:', error)
    return Response.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE - delete post
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    await sql`DELETE FROM blog_posts WHERE id = ${id}`
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}