import { put } from '@vercel/blob'

export async function GET() {
  try {
    // Try to upload a simple text file
    const blob = await put('test.txt', 'Hello World', {
      access: 'public',
    })

    return Response.json({ 
      success: true, 
      url: blob.url,
      message: 'Blob storage is working!'
    })
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}