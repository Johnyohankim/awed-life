'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

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

function AvatarCircle({ name, size = 'lg' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const sizeClasses = size === 'lg'
    ? 'w-24 h-24 text-3xl'
    : 'w-12 h-12 text-lg'

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg`}>
      {initial}
    </div>
  )
}

function MilestoneBadge({ milestone, earned }) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
      earned
        ? 'border-yellow-300 bg-yellow-50'
        : 'border-gray-200 bg-gray-50 opacity-40'
    }`}>
      <span className="text-3xl mb-2">{milestone.emoji}</span>
      <span className="text-xs font-bold text-center">{milestone.label}</span>
      <span className="text-xs text-gray-500 mt-1">{milestone.count} cards</span>
      {earned && (
        <span className="text-xs text-yellow-600 font-medium mt-1">✓ Earned</span>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isOwnProfile = !userId

  useEffect(() => {
    if (status === 'unauthenticated' && !userId) {
      router.push('/login')
    }
  }, [status, router, userId])

  useEffect(() => {
    if (status === 'authenticated' || userId) {
      loadProfile()
    }
  }, [status, userId])

  const loadProfile = async () => {
    try {
      const url = userId ? `/api/profile/${userId}` : '/api/profile'
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setProfile(data)
        setNewName(data.name || '')
      }
    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      })
      const data = await response.json()

      if (data.success) {
        setProfile(prev => ({ ...prev, name: newName.trim() }))
        setEditing(false)
      }
    } catch (error) {
      console.error('Error saving name:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${profile.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading' || loading) {
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
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const earnedMilestones = milestones.filter(m => profile.totalCards >= m.count)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <button
            onClick={() => router.push(isOwnProfile ? '/cards' : '/')}
            className="text-2xl font-bold"
          >
            Awed
          </button>
          {isOwnProfile && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/cards')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Today's Cards
              </button>
              <button
                onClick={() => router.push('/collection')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Collection
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <AvatarCircle name={profile.name} size="lg" />
              <div>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-2xl font-bold border-b-2 border-blue-500 outline-none px-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setNewName(profile.name) }}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.name || 'Anonymous'}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>

            {/* Share button */}
            {isOwnProfile && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? '✓ Copied!' : '🔗 Share Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-3xl font-bold">{profile.totalCards}</p>
              <p className="text-sm text-gray-500 mt-1">Cards Collected</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-3xl font-bold">🔥 {profile.streak}</p>
              <p className="text-sm text-gray-500 mt-1">Day Streak</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-3xl font-bold">{profile.categoriesCount}/8</p>
              <p className="text-sm text-gray-500 mt-1">Categories</p>
            </div>
          </div>
        </div>

        {/* Milestone badges */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Milestones</h2>
          <div className="grid grid-cols-5 gap-3">
            {milestones.map((milestone) => (
              <MilestoneBadge
                key={milestone.count}
                milestone={milestone}
                earned={profile.totalCards >= milestone.count}
              />
            ))}
          </div>
        </div>

        {/* Recent collection preview */}
        {profile.recentCards && profile.recentCards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {isOwnProfile ? 'Recent Collection' : 'Collection'}
              </h2>
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/collection')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all →
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {profile.recentCards.map((card) => (
                <div
                  key={card.id}
                  className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${
                    categoryColors[card.category] || 'from-gray-400 to-gray-600'
                  } flex flex-col items-center justify-center p-3`}
                >
                  <p className="text-white text-lg mb-1">✨</p>
                  <p className="text-white font-bold text-center text-xs drop-shadow">
                    {categoryLabels[card.category] || card.category}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty collection */}
        {(!profile.recentCards || profile.recentCards.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">🎴</p>
            <p className="text-gray-500">No cards collected yet</p>
            {isOwnProfile && (
              <button
                onClick={() => router.push('/cards')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium"
              >
                Start collecting
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}