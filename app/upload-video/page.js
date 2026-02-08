'use client'

import { useState } from 'react'

export default function UploadVideo() {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = e.target.video.files[0]
    
    if (!file) {
      alert('Please select a video file')
      return
    }

    setUploading(true)

    try {
      const response = await fetch(`/api/upload-video?filename=${file.name}`, {
        method: 'POST',
        body: file,
      })

      const data = await response.json()
      setUrl(data.url)
      alert('Video uploaded successfully!')
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Upload Manifesto Video</h1>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select manifesto1.mp4:
            </label>
            <input
              type="file"
              name="video"
              accept="video/mp4"
              className="w-full"
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>

        {url && (
          <div className="mt-6 p-4 bg-green-50 rounded">
            <p className="text-sm font-medium mb-2">Video URL:</p>
            <code className="text-xs break-all">{url}</code>
          </div>
        )}
      </div>
    </div>
  )
}