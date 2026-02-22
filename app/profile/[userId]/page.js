'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import AweraCircle from '../../components/AweraCircle'

function AvatarCircle({ name }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C97B84] to-[#957BA8] flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
      {initial}
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">Loading profile...</p>
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
    <div className="min-h-screen bg-surface pb-8">
      <nav className="bg-surface-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-3xl">
          <button onClick={() => router.push('/')} className="text-2xl font-bold">
            Awed
          </button>
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-primary font-medium"
          >
            Sign in
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Profile + Awera */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-6 mb-4 flex flex-col items-center">
          <AvatarCircle name={profile.name} />
          <h1 className="text-xl font-bold mt-3">{profile.name || 'Anonymous'}</h1>
          <p className="text-text-muted text-xs mt-1">
            Since {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long'
            })}
          </p>

          <div className="mt-5">
            <AweraCircle totalCards={profile.totalCards} totalWalks={profile.totalWalks} size="lg" />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-3 mb-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-2xl font-bold">{profile.totalCards}</p>
              <p className="text-xs text-text-muted">Moments</p>
            </div>
            <div className="bg-primary-light rounded-lg p-3">
              <p className="text-2xl font-bold">{profile.totalWalks}</p>
              <p className="text-xs text-text-muted">Walks</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-text-muted text-sm mb-3">Start your own awe journey</p>
          <button
            onClick={() => router.push('/signup')}
            className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-hover font-medium"
          >
            Join Awed for free
          </button>
        </div>
      </div>
    </div>
  )
}
