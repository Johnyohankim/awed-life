'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

const categoryColors = {
  'moral-beauty': 'from-rose-400 to-pink-600',
  'collective-effervescence': 'from-orange-400 to-red-600',
  'nature': 'from-green-400 to-emerald-600',
  'music': 'from-purple-400 to-violet-600',
  'visual-design': 'from-blue-400 to-cyan-600',
  'spirituality': 'from-amber-400 to-yellow-600',
  'life-death': 'from-slate-400 to-gray-600',
  'epiphany': 'from-indigo-400 to-blue-600'
}

const categoryLabels = {
  'moral-beauty': 'Moral Beauty',
  'collective-effervescence': 'Collective Effervescence',
  'nature': 'Nature',
  'music': 'Music',
  'visual-design': 'Visual Design',
  'spirituality': 'Spirituality & Religion',
  'life-death': 'Life & Death',
  'epiphany': 'Epiphany'
}

const milestones = [
  { count: 10, label: 'First Steps', emoji: '🌱' },
  { count: 50, label: 'Awe Seeker', emoji: '🌟' },
  { count: 100, label: 'Wonder Collector', emoji: '✨' },
  { count: 500, label: 'Awe Devotee', emoji: '🌈' },
  { count: 1000, label: 'Awe Master', emoji: '🌌' },
]

function AvatarCircle({ name }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
      {initial}
    </div>
  )
}

function MilestoneBadge({ milestone, earned }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
      earned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-40'
    }`}>
      <span className="text-2xl mb-1">{milestone.emoji}</span>
      <span className="text-xs font-bold text-center leading-tight">{milestone.label}</span>
      <span className="text-xs text-gray-500 mt-1">{milestone.count}</span>
      {earned && <span className="text-xs text-yellow-600 font-medium mt-1">✓</span>}
    </div>
  )
}

export default function PublicProfilePage({ params }) {
  const router = useRouter()
  const { userId } = use(params)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`)
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        setProfile(data)
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="text-blue-600">Go home</button>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <button onClick={() => router.push('/')} className="text-2xl font-bold">
            Awed
          </button>
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-blue-600 font-medium"
          >
            Sign in →
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-3xl">

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4">
            <AvatarCircle name={profile.name} />
            <div>
              <h1 className="text-xl font-bold">{profile.name || 'Anonymous'}</h1>
              <p className="text-gray-500 text-xs mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold mb-4">Stats</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold">{profile.totalCards}</p>
              <p className="text-xs text-gray-500 mt-1">Cards</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold">🔥 {profile.streak}</p>
              <p className="text-xs text-gray-500 mt-1">Streak</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold">{profile.categoriesCount}/8</p>
              <p className="text-xs text-gray-500 mt-1">Categories</p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold mb-4">Milestones</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {milestones.map((milestone) => (
              <MilestoneBadge
                key={milestone.count}
                milestone={milestone}
                earned={profile.totalCards >= milestone.count}
              />
            ))}
          </div>
        </div>

        {/* Recent collection */}
        {profile.recentCards && profile.recentCards.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold mb-4">Collection</h2>
            <div className="grid grid-cols-4 gap-2">
              {profile.recentCards.map((card) => (
                <div
                  key={card.id}
                  className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${
                    categoryColors[card.category] || 'from-gray-400 to-gray-600'
                  } flex flex-col items-center justify-center p-2`}
                >
                  <p className="text-white text-base mb-1">✨</p>
                  <p className="text-white font-bold text-center text-xs drop-shadow leading-tight">
                    {categoryLabels[card.category] || card.category}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">🎴</p>
            <p className="text-gray-500 text-sm">No cards collected yet</p>
          </div>
        )}

        {/* CTA for non-logged in visitors */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-3">Start your own awe journey</p>
          <button
            onClick={() => router.push('/signup')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-medium"
          >
            Join Awed for free →
          </button>
        </div>

      </div>
    </div>
  )
}