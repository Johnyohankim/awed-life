import { createSubmissionsTable } from '@/lib/db'

export async function GET() {
  try {
    await createSubmissionsTable()
    return Response.json({ success: true, message: 'Database initialized!' })
  } catch (error) {
    console.error('Database init error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}