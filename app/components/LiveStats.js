'use client'

import { useEffect, useState } from 'react'

export default function LiveStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMoments: 0,
    totalSubmissions: 0,
    activeStreaks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center gap-8 py-6">
        <div className="animate-pulse bg-white/10 rounded-lg h-16 w-24"></div>
        <div className="animate-pulse bg-white/10 rounded-lg h-16 w-24"></div>
        <div className="animate-pulse bg-white/10 rounded-lg h-16 w-24"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-12 py-6">
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
          {stats.totalUsers.toLocaleString()}
        </div>
        <div className="text-sm md:text-base text-white/80">
          {stats.totalUsers === 1 ? 'Person' : 'People'} Collecting Awe
        </div>
      </div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
          {stats.totalMoments.toLocaleString()}
        </div>
        <div className="text-sm md:text-base text-white/80">
          Moments Collected
        </div>
      </div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
          {stats.totalSubmissions.toLocaleString()}
        </div>
        <div className="text-sm md:text-base text-white/80">
          Moments Shared
        </div>
      </div>

      {stats.activeStreaks > 0 && (
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-white mb-1">
            🔥 {stats.activeStreaks}
          </div>
          <div className="text-sm md:text-base text-white/80">
            Active Streak{stats.activeStreaks !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}