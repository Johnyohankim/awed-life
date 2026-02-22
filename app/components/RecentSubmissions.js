'use client'

import { useState, useEffect } from 'react'
import { CATEGORY_LABELS } from '../lib/constants'

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

  if (loading) return <p className="text-center text-text-muted">Loading...</p>
  if (submissions.length === 0) return <p className="text-center text-text-muted">No submissions yet. Be the first!</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {submissions.slice(0, 3).map((submission) => {
        const videoId = getYouTubeId(submission.videoLink)
        const isInstagram = isInstagramUrl(submission.videoLink)
        return (
          <div key={submission.id} className="bg-surface rounded-xl overflow-hidden shadow-sm border border-border">
            <div className="aspect-video">
              {isInstagram ? (
                <a href={submission.videoLink} target="_blank" rel="noopener noreferrer"
                  className="w-full h-full bg-gradient-to-br from-[#C4A8D4] via-[#E8B4B8] to-[#E8C4A0] flex items-center justify-center">
                  <p className="text-white font-medium">Watch on Instagram ↗</p>
                </a>
              ) : videoId ? (
                <iframe width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Awe moment" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              ) : (
                <div className="w-full h-full bg-primary-light flex items-center justify-center">
                  <p className="text-text-muted">Video unavailable</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="inline-block px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-medium">
                {CATEGORY_LABELS[submission.category] || submission.category}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
