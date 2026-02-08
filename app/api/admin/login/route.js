import { cookies } from 'next/headers'

// Set your admin password here
const ADMIN_PASSWORD = '2nd@ryAwed'  // ← Change this to your own password

export async function POST(request) {
  try {
    const { password } = await request.json()
    
    if (password === ADMIN_PASSWORD) {
      // Set a cookie to remember they're logged in
      const cookieStore = await cookies()
      cookieStore.set('admin-auth', 'true', {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return Response.json({ success: true })
    } else {
      return Response.json({ success: false }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ success: false }, { status: 500 })
  }
}