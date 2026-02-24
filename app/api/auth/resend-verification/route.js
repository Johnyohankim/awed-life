import { sql } from '@vercel/postgres'
import { createVerificationToken } from '@/lib/email-token'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 })
    }

    const result = await sql`
      SELECT id, name, email_verified FROM users WHERE email = ${email}
    `

    // Always return success to prevent email enumeration
    if (result.rows.length === 0 || result.rows[0].email_verified) {
      return Response.json({ success: true })
    }

    const user = result.rows[0]
    const token = createVerificationToken(email, user.id)
    await sendVerificationEmail(email, user.name, token)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Resend verification error:', error)
    return Response.json({ error: 'Failed to resend' }, { status: 500 })
  }
}
