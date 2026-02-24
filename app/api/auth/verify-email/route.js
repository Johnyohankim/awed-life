import { sql } from '@vercel/postgres'
import { verifyToken } from '@/lib/email-token'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const baseUrl = new URL(request.url).origin

  if (!token) {
    return Response.redirect(`${baseUrl}/verify-email?error=missing-token`)
  }

  const payload = verifyToken(token)

  if (!payload) {
    return Response.redirect(`${baseUrl}/verify-email?error=invalid-or-expired`)
  }

  try {
    const user = await sql`
      SELECT email_verified FROM users WHERE id = ${payload.userId} AND email = ${payload.email}
    `

    if (user.rows.length === 0) {
      return Response.redirect(`${baseUrl}/verify-email?error=user-not-found`)
    }

    if (user.rows[0].email_verified) {
      return Response.redirect(`${baseUrl}/login?verified=already`)
    }

    await sql`
      UPDATE users SET email_verified = true, email_verified_at = NOW()
      WHERE id = ${payload.userId} AND email = ${payload.email}
    `

    return Response.redirect(`${baseUrl}/login?verified=true`)
  } catch (error) {
    console.error('Email verification error:', error)
    return Response.redirect(`${baseUrl}/verify-email?error=server-error`)
  }
}
