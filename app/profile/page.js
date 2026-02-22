'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../lib/constants'

const milestones = [
  { count: 5, label: 'First Pause', emoji: '🌱' },
  { count: 15, label: 'Gentle Noticer', emoji: '🌿' },
  { count: 30, label: 'Steady Witness', emoji: '🌾' },
  { count: 75, label: 'Open Observer', emoji: '🌤' },
  { count: 150, label: 'Deepening Presence', emoji: '🌅' },
  { count: 300, label: 'Living in Wonder', emoji: '🌌' },
  { count: 500, label: 'Rooted in Awe', emoji: '🌊' },
]

function AvatarCircle({ name, size = 'lg' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const sizeClasses = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-12 h-12 text-lg'
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-[#C97B84] to-[#957BA8] flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
      {initial}
    </div>
  )
}

function MilestoneBadge({ milestone, earned }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
      earned ? 'border-accent bg-accent-light' : 'border-border bg-surface opacity-40'
    }`}>
      <span className="text-2xl mb-1">{milestone.emoji}</span>
      <span className="text-xs font-bold text-center leading-tight">{milestone.label}</span>
      <span className="text-xs text-text-muted mt-1">{milestone.count}</span>
      {earned && <span className="text-xs text-accent font-medium mt-1">✓</span>}
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
    if (status === 'unauthenticated' && !userId) router.push('/login')
    // Redirect own profile to /journey
    if (status === 'authenticated' && isOwnProfile) router.push('/journey')
  }, [status, router, userId, isOwnProfile])

  useEffect(() => {
    if (status === 'authenticated' || userId) loadProfile()
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">Loading profile…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="text-primary">Go home</button>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      {/* Nav */}
      <nav className="bg-surface-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <Link href={isOwnProfile ? '/cards' : '/'} className="font-bold text-2xl">
            Awed
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {isOwnProfile && (
              <>
                <Link href="/explore" className="text-sm text-text-secondary hover:text-text-primary">Explore</Link>
                <Link href="/cards" className="text-sm text-text-secondary hover:text-text-primary">Cards</Link>
                <Link href="/journey" className="text-sm text-text-secondary hover:text-text-primary">My Journey</Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-text-secondary hover:text-text-primary">Sign Out</button>
              </>
            )}
          </div>
          {isOwnProfile && (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-text-muted">Sign Out</button>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-3xl">

        {/* Profile header */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <AvatarCircle name={profile.name} size="lg" />
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-xl font-bold border-b-2 border-primary outline-none w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={saving} className="text-sm text-primary font-medium whitespace-nowrap">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setNewName(profile.name) }} className="text-sm text-text-muted">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary truncate">{profile.name || 'Anonymous'}</h1>
                  {isOwnProfile && (
                    <button onClick={() => setEditing(true)} className="text-text-muted text-sm flex-shrink-0">✏️</button>
                  )}
                </div>
              )}
              <p className="text-text-muted text-xs mt-1">
                Since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl text-sm text-text-secondary active:bg-surface transition-colors"
            >
              {copied ? '✓ Link Copied!' : '🔗 Share Profile'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-bold text-base mb-4">Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-surface rounded-xl p-3">
              <p className="text-2xl font-bold">{profile.totalCards}</p>
              <p className="text-xs text-text-muted mt-1">Cards</p>
            </div>
            <div className="bg-accent-light rounded-xl p-3">
              <p className="text-2xl font-bold">🔥 {profile.streak}</p>
              <p className="text-xs text-text-muted mt-1">Streak</p>
            </div>
            <div className="bg-primary-light rounded-xl p-3">
              <p className="text-2xl font-bold">{profile.categoriesCount}/8</p>
              <p className="text-xs text-text-muted mt-1">Categories</p>
            </div>
            <div className="bg-primary-light rounded-xl p-3">
              <p className="text-2xl font-bold">⭐ {profile.submissionPoints || 0}</p>
              <p className="text-xs text-text-muted mt-1">Submissions</p>
              {isOwnProfile && (profile.submissionPoints || 0) > 0 && (
                <p className="text-xs text-accent mt-1">+{profile.submissionPoints} extra slots</p>
              )}
            </div>
          </div>

          {/* Submission CTA for own profile */}
          {isOwnProfile && (
            <button
              onClick={() => router.push('/submit')}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-accent-light border border-border rounded-xl text-sm text-accent font-medium hover:bg-accent-light/80 transition-colors"
            >
              <span>⭐</span>
              Submit a moment — earn extra card slots
            </button>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-5 mb-4">
          <h2 className="font-bold text-base mb-4">Milestones</h2>
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
        {profile.recentCards && profile.recentCards.length > 0 && (
          <div className="bg-surface-card rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base">
                {isOwnProfile ? 'Recent Collection' : 'Collection'}
              </h2>
              {isOwnProfile && (
                <button onClick={() => router.push('/journey')} className="text-sm text-primary">
                  View all →
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {profile.recentCards.map((card) => (
                <div
                  key={card.id}
                  className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${
                    CATEGORY_COLORS[card.category] || 'from-[#B8B0A8] to-[#8A8278]'
                  } flex flex-col items-center justify-center p-2`}
                >
                  <p className="text-white text-base mb-1">
                    {card.is_submission ? '⭐' : '✨'}
                  </p>
                  <p className="text-white font-bold text-center text-xs drop-shadow leading-tight">
                    {CATEGORY_LABELS[card.category] || card.category}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!profile.recentCards || profile.recentCards.length === 0) && (
          <div className="bg-surface-card rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-3">🎴</p>
            <p className="text-text-muted text-sm">No cards collected yet</p>
            {isOwnProfile && (
              <button onClick={() => router.push('/cards')} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium">
                Start collecting
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
