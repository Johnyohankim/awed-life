import { sql } from '@vercel/postgres'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) return Response.json({ unverified: false })

    const result = await sql`
      SELECT email_verified FROM users WHERE email = ${email} AND password_hash IS NOT NULL
    `

    if (result.rows.length === 0) {
      return Response.json({ unverified: false })
    }

    return Response.json({ unverified: !result.rows[0].email_verified })
  } catch {
    return Response.json({ unverified: false })
  }
}
