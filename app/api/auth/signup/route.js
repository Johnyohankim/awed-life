import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

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

    // Create user
    await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${hashedPassword}, ${name})
    `

    return Response.json({ success: true })

  } catch (error) {
    console.error('Signup error:', error)
    return Response.json(
      { success: false, message: 'Signup failed' },
      { status: 500 }
    )
  }
}