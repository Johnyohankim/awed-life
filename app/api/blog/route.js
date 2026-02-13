import { sql } from '@vercel/postgres'

// GET /api/blog - list all published posts
// GET /api/blog?slug=xxx - get single post by slug
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const result = await sql`
        SELECT id, title, slug, content, excerpt, created_at, updated_at
        FROM blog_posts
        WHERE slug = ${slug} AND published = true
      `
      if (result.rows.length === 0) {
        return Response.json({ error: 'Post not found' }, { status: 404 })
      }
      return Response.json({ post: result.rows[0] })
    }

    const result = await sql`
      SELECT id, title, slug, excerpt, created_at
      FROM blog_posts
      WHERE published = true
      ORDER BY created_at DESC
    `
    return Response.json({ posts: result.rows })

  } catch (error) {
    console.error('Blog GET error:', error)
    return Response.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}