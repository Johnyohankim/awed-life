'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?days=${days}`)
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading analytics</p>
          <p className="text-sm text-gray-500 mb-4">Make sure you've initialized the analytics table:</p>
          <a href="/api/analytics/init" target="_blank" className="text-blue-600 hover:underline">
            Click here to initialize
          </a>
        </div>
      </div>
    )
  }

  const awedCount = data.reactionStats?.find(r => r.event_name === 'reaction_awed')?.count || 0
  const nawedCount = data.reactionStats?.find(r => r.event_name === 'reaction_nawed')?.count || 0
  const totalReactions = awedCount + nawedCount
  const awedPercentage = totalReactions > 0 ? Math.round((awedCount / totalReactions) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">{data.period}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/admin')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                ← Back to Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Time Period Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 30, 90, 365].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Total Events</p>
            <p className="text-3xl font-bold">{data.totalEvents?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Cards Kept</p>
            <p className="text-3xl font-bold">
              {data.eventsByName?.find(e => e.event_name === 'card_kept')?.count || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Total Reactions</p>
            <p className="text-3xl font-bold">{totalReactions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Awed Rate</p>
            <p className="text-3xl font-bold">{awedPercentage}%</p>
          </div>
        </div>

        {/* Daily Active Users */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Daily Active Users</h2>
          {data.dailyActiveUsers && data.dailyActiveUsers.length > 0 ? (
            <div className="space-y-2">
              {data.dailyActiveUsers.slice(0, 10).map(day => (
                <div key={day.date} className="flex items-center gap-4">
                  <p className="text-sm text-gray-600 w-32">{new Date(day.date).toLocaleDateString()}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full flex items-center px-3"
                      style={{ width: `${Math.max((day.users / Math.max(...data.dailyActiveUsers.map(d => d.users))) * 100, 5)}%` }}
                    >
                      <span className="text-sm font-medium text-white">{day.users}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No user activity yet</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Popular Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Popular Categories</h2>
            {data.popularCategories && data.popularCategories.length > 0 ? (
              <div className="space-y-3">
                {data.popularCategories.map(cat => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{cat.category?.replace(/-/g, ' ')}</span>
                      <span className="text-gray-500">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(cat.count / data.popularCategories[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No category data yet</p>
            )}
          </div>

          {/* Reaction Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Reactions</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">😮 Awed</span>
                  <span className="text-gray-500">{awedCount} ({awedPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ width: `${awedPercentage}%` }}
                  >
                    {awedPercentage > 10 && `${awedPercentage}%`}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">😐 Nawed</span>
                  <span className="text-gray-500">{nawedCount} ({100 - awedPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ width: `${100 - awedPercentage}%` }}
                  >
                    {(100 - awedPercentage) > 10 && `${100 - awedPercentage}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Milestones Achieved</h2>
          {data.milestones && data.milestones.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.milestones.map(m => (
                <div key={m.milestone} className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{m.count}</p>
                  <p className="text-sm text-gray-600">{m.milestone} cards</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No milestones achieved yet</p>
          )}
        </div>

        {/* All Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">All Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Event</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.eventsByName?.map(event => (
                  <tr key={event.event_name} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">{event.event_name}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{event.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
