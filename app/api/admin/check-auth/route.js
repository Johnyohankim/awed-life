import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    
    if (authCookie?.value === 'true') {
      return Response.json({ authenticated: true })
    } else {
      return Response.json({ authenticated: false }, { status: 401 })
    }
    
  } catch (error) {
    return Response.json({ authenticated: false }, { status: 500 })
  }
}