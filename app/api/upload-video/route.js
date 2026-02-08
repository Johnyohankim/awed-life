import { put } from '@vercel/blob'

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return Response.json({ error: 'Filename is required' }, { status: 400 })
    }

    const blob = await put(filename, request.body, {
      access: 'public',
    })

    return Response.json({ url: blob.url })
    
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}