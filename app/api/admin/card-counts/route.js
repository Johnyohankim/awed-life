import { getAvailableCardCounts } from '@/lib/db'

export async function GET() {
  try {
    const counts = await getAvailableCardCounts()
    return Response.json({ counts })
  } catch (error) {
    console.error('Error getting card counts:', error)
    return Response.json({ counts: [] }, { status: 500 })
  }
}