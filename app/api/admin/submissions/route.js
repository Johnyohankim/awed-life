import { getSubmissions } from '@/lib/db'

export async function GET() {
  try {
    const submissions = await getSubmissions()
    
    // Convert database format to match frontend expectations
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      videoLink: sub.video_link,
      category: sub.category,
      hashtags: sub.hashtags,
      email: sub.email,
      submittedAt: sub.submitted_at,
      approved: sub.approved
    }))
    
    return Response.json({ submissions: formattedSubmissions })
    
  } catch (error) {
    console.error('Error reading submissions:', error)
    return Response.json(
      { submissions: [] },
      { status: 500 }
    )
  }
}