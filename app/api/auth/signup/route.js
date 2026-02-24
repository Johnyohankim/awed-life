import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'
import { createVerificationToken } from '@/lib/email-token'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()

    // Check if user already exists
    const existing = await sql`
      SELECT * FROM users WHERE email = ${email}
    `

    if (existing.rows.length > 0) {
      return Response.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Dev mode: auto-verify, preserve current behavior
    const isDev = process.env.NODE_ENV === 'development'

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, name, email_verified)
      VALUES (${email}, ${hashedPassword}, ${name}, ${isDev})
      RETURNING id
    `

    if (!isDev) {
      // Send verification email — don't fail signup if email fails
      try {
        const token = createVerificationToken(email, result.rows[0].id)
        await sendVerificationEmail(email, name, token)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // User is created, they can use resend later
      }
      return Response.json({
        success: true,
        requiresVerification: true,
      })
    }

    // Dev mode: return as before, client will auto-sign-in
    return Response.json({ success: true, requiresVerification: false })

  } catch (error) {
    console.error('Signup error:', error)
    return Response.json(
      { success: false, message: 'Signup failed' },
      { status: 500 }
    )
  }
}
