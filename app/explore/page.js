'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import BottomNav from '../components/BottomNav'
import { EXPLORE_ACTIVITIES, TIME_HORIZONS, EXPLORE_CATEGORY_ORDER } from '../lib/exploreActivities'

function ActivityItem({ activity, isCollected, onToggle, color }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await onToggle(activity.id, isCollected)
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
        isCollected
          ? 'bg-green-50 border border-green-200'
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
      } ${loading ? 'opacity-60' : ''}`}
    >
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
        isCollected
          ? 'bg-green-500'
          : 'border-2 border-gray-200'
      }`}>
        {isCollected && (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        )}
      </div>
      <span className={`text-sm leading-snug ${isCollected ? 'text-green-800' : 'text-gray-700'}`}>
        {activity.text}
      </span>
    </button>
  )
}

function CategorySection({ categoryKey, category, collectedSet, onToggle, isExpanded, onExpandToggle }) {
  const [activeHorizon, setActiveHorizon] = useState('today')

  const activities = category[activeHorizon] || []
  const allActivities = [...category.today, ...category.month, ...category.lifetime]
  const collectedCount = allActivities.filter(a => collectedSet.has(a.id)).length
  const totalCount = allActivities.length

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Category header */}
      <button
        onClick={onExpandToggle}
        className="w-full text-left"
      >
        <div className={`bg-gradient-to-r ${category.color} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">{category.label}</h3>
              <p className="text-white/80 text-xs">{category.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium">{collectedCount}/{totalCount}</span>
              </div>
              <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-white/80 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (collectedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4">
          {/* Time horizon tabs */}
          <div className="flex gap-2 mb-4">
            {Object.entries(TIME_HORIZONS).map(([key, horizon]) => {
              const horizonActivities = category[key] || []
              const horizonCollected = horizonActivities.filter(a => collectedSet.has(a.id)).length
              return (
                <button
                  key={key}
                  onClick={() => setActiveHorizon(key)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    activeHorizon === key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="block">{horizon.emoji} {horizon.label}</span>
                  <span className={`block mt-0.5 ${activeHorizon === key ? 'text-white/70' : 'text-gray-400'}`}>
                    {horizonCollected}/{horizonActivities.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isCollected={collectedSet.has(activity.id)}
                onToggle={onToggle}
                color={category.color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [collected, setCollected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadCollected()
    }
  }, [status])

  const loadCollected = async () => {
    try {
      const res = await fetch('/api/explore')
      const data = await res.json()
      if (data.collected) {
        setCollected(new Set(data.collected.map(c => c.activity_id)))
      }
    } catch (error) {
      console.error('Error loading collected:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = useCallback(async (activityId, isCurrentlyCollected) => {
    // Optimistic update
    setCollected(prev => {
      const next = new Set(prev)
      if (isCurrentlyCollected) {
        next.delete(activityId)
      } else {
        next.add(activityId)
      }
      return next
    })

    try {
      if (isCurrentlyCollected) {
        await fetch(`/api/explore?activityId=${activityId}`, { method: 'DELETE' })
      } else {
        await fetch('/api/explore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityId })
        })
      }
    } catch (error) {
      // Revert on error
      setCollected(prev => {
        const next = new Set(prev)
        if (isCurrentlyCollected) {
          next.add(activityId)
        } else {
          next.delete(activityId)
        }
        return next
      })
    }
  }, [])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  // Stats
  const allActivities = EXPLORE_CATEGORY_ORDER.flatMap(key => {
    const cat = EXPLORE_ACTIVITIES[key]
    return [...cat.today, ...cat.month, ...cat.lifetime]
  })
  const totalCollected = allActivities.filter(a => collected.has(a.id)).length
  const totalActivities = allActivities.length

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <button onClick={() => router.push('/cards')} className="text-2xl font-bold hover:text-gray-700 transition-colors">Awed</button>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/explore')} className="text-sm text-blue-600 font-medium">Explore</button>
            <button onClick={() => router.push('/cards')} className="text-sm text-gray-600 hover:text-gray-900">Today's Cards</button>
            <button onClick={() => router.push('/journey')} className="text-sm text-gray-600 hover:text-gray-900">My Journey</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Explore Awe</h1>
          <p className="text-gray-500 text-sm md:text-base mb-3">
            Activities to experience awe in your daily life
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <span className="text-blue-700 text-sm font-medium">
              {totalCollected} of {totalActivities} collected
            </span>
          </div>
        </div>

        {/* Category cards */}
        <div className="space-y-3">
          {EXPLORE_CATEGORY_ORDER.map(key => (
            <CategorySection
              key={key}
              categoryKey={key}
              category={EXPLORE_ACTIVITIES[key]}
              collectedSet={collected}
              onToggle={handleToggle}
              isExpanded={expandedCategory === key}
              onExpandToggle={() => setExpandedCategory(expandedCategory === key ? null : key)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
