import { updateSubmissionStatus, deleteSubmission } from '@/lib/db'

export async function POST(request) {
  try {
    const { id, action } = await request.json()
    
    if (action === 'approve') {
      await updateSubmissionStatus(id, true)
    } else if (action === 'reject') {
      await deleteSubmission(id)
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('Error updating submission:', error)
    return Response.json(
      { success: false, message: 'Error updating submission' },
      { status: 500 }
    )
  }
}