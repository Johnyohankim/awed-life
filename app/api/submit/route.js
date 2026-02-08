import { addSubmission } from '@/lib/db'

export async function POST(request) {
  try {
    const body = await request.json()
    
    const submission = await addSubmission(
      body.videoLink,
      body.category,
      body.hashtags || '',
      body.email
    )
    
    console.log('Submission saved:', submission)
    
    return Response.json({ 
      success: true, 
      message: 'Submission received!' 
    })
    
  } catch (error) {
    console.error('Error saving submission:', error)
    return Response.json(
      { success: false, message: 'Error saving submission' },
      { status: 500 }
    )
  }
}