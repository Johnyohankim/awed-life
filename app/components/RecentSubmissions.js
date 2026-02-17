'use client'

import { useState, useEffect } from 'react'

const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

const isInstagramUrl = (url) => url && url.includes('instagram.com')

export default function RecentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recent-submissions')
      .then(r => r.json())
      .then(data => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center text-gray-500">Loading...</p>
  if (submissions.length === 0) return <p className="text-center text-gray-500">No submissions yet. Be the first!</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {submissions.slice(0, 3).map((submission) => {
        const videoId = getYouTubeId(submission.videoLink)
        const isInstagram = isInstagramUrl(submission.videoLink)
        return (
          <div key={submission.id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video">
              {isInstagram ? (
                <a href={submission.videoLink} target="_blank" rel="noopener noreferrer"
                  className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <p className="text-white font-bold">Watch on Instagram ↗</p>
                </a>
              ) : videoId ? (
                <iframe width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Awe moment" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Video unavailable</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {submission.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
