'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { CATEGORY_COLORS, CATEGORY_LABELS, MILESTONES } from '../lib/constants'
import { trackEvent, EVENTS } from '../lib/analytics'

function getYouTubeId(url) {
  if (!url) return null

  try {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,  // Standard & short URLs
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,                     // Embed URLs
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,                    // Shorts
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,                         // /v/ format
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/                 // Mobile URLs
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting YouTube ID:', error)
    return null
  }
}

function getYouTubeThumbnail(url) {
  if (!url) return null
  const videoId = getYouTubeId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

function isInstagramUrl(url) {
  return url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p/'))
}

function isTwitterUrl(url) {
  return url && (url.includes('twitter.com') || url.includes('x.com'))
}

const categoryColors = CATEGORY_COLORS
const categoryLabels = CATEGORY_LABELS
const milestones = MILESTONES

function getMilestoneProgress(total) {
  const next = milestones.find(m => m > total) || milestones[milestones.length - 1]
  const prev = milestones[milestones.indexOf(next) - 1] || 0
  const progress = ((total - prev) / (next - prev)) * 100
  return { next, prev, progress: Math.min(progress, 100) }
}

function ReactionBar({ submissionId }) {
  const [reaction, setReaction] = useState(null)
  const [awedCount, setAwedCount] = useState(0)
  const [nawedCount, setNawedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!submissionId) return

    const abortController = new AbortController()

    fetch(`/api/moment-reactions?submissionId=${submissionId}`, {
      signal: abortController.signal
    })
      .then(r => r.json())
      .then(data => {
        setAwedCount(data.awedCount || 0)
        setNawedCount(data.nawedCount || 0)
        setReaction(data.userReaction || null)
        setLoading(false)
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setLoading(false)
        }
      })

    return () => abortController.abort()
  }, [submissionId])

  const handleReaction = async (type) => {
    try {
      const response = await fetch('/api/moment-reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reactionType: type })
      })
      const data = await response.json()
      if (data.success) {
        if (data.action === 'removed') {
          setReaction(null)
          if (type === 'awed') setAwedCount(p => Math.max(p - 1, 0))
          else setNawedCount(p => Math.max(p - 1, 0))
        } else if (data.action === 'added') {
          setReaction(type)
          if (type === 'awed') setAwedCount(p => p + 1)
          else setNawedCount(p => p + 1)
        } else if (data.action === 'updated') {
          setReaction(type)
          if (type === 'awed') { setAwedCount(p => p + 1); setNawedCount(p => Math.max(p - 1, 0)) }
          else { setNawedCount(p => p + 1); setAwedCount(p => Math.max(p - 1, 0)) }
        }
      }
    } catch (error) { console.error('Reaction error:', error) }
  }

  if (loading) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={() => handleReaction('awed')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
          reaction === 'awed' 
            ? 'border-yellow-400 bg-yellow-400/30' 
            : 'border-white/30 bg-white/10 hover:bg-white/20'
        }`}
      >
        <img src="/awed-emoji.png" alt="awed" width={24} height={24} />
        <span className="font-medium text-sm text-white">Awed</span>
        {awedCount > 0 && <span className="text-sm text-white/80">{awedCount}</span>}
      </button>
      <button
        onClick={() => handleReaction('nawed')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
          reaction === 'nawed' 
            ? 'border-blue-400 bg-blue-400/30' 
            : 'border-white/30 bg-white/10 hover:bg-white/20'
        }`}
      >
        <img src="/nawed-emoji.png" alt="nawed" width={24} height={24} />
        <span className="font-medium text-sm text-white">Nawed</span>
        {nawedCount > 0 && <span className="text-sm text-white/80">{nawedCount}</span>}
      </button>
    </div>
  )
}

function FullscreenCardModal({ card, onClose, onDelete, onUpdate }) {
  const videoId = getYouTubeId(card.video_link)
  const isInstagram = isInstagramUrl(card.video_link)
  const isTwitter = isTwitterUrl(card.video_link)
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedJournal, setEditedJournal] = useState(card.journal_text)
  const [saving, setSaving] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/collection?id=${card.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        onDelete(card.id)
        onClose()
      } else {
        alert('Failed to delete card. Please try again.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete card. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveJournal = async () => {
    // Validation
    if (!card.is_submission && editedJournal.trim().length < 10) {
      alert('Journal entry must be at least 10 characters')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          journalText: editedJournal
        })
      })
      const data = await response.json()

      if (data.success) {
        onUpdate(card.id, { journal_text: editedJournal })
        setIsEditing(false)
      } else {
        alert(data.error || 'Failed to save journal')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save journal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedJournal(card.journal_text)
    setIsEditing(false)
  }

  // Handle back button
  useEffect(() => {
    // Push a history state when modal opens
    window.history.pushState({ modal: true }, '')

    const handlePopState = (e) => {
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video container - fullscreen */}
      <div className="flex-1 relative">
        {isInstagram ? (
          <a
            href={card.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-white mb-4">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
            <p className="text-white font-bold text-xl">Watch on Instagram</p>
            <p className="text-white text-sm mt-2 opacity-75">Tap to open ↗</p>
          </a>
        ) : isTwitter ? (
          <a
            href={card.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full bg-black flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-white mb-4">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <p className="text-white font-bold text-xl">Watch on X</p>
            <p className="text-white text-sm mt-2 opacity-75">Tap to open ↗</p>
          </a>
        ) : videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={label}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white">Video unavailable</p>
          </div>
        )}

        {/* Overlay controls - top */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-lg drop-shadow">{label}</h3>
              <p className="text-white/90 text-sm">{date}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center justify-center text-white hover:bg-red-500/30 transition-all disabled:opacity-50"
                title="Delete card"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Reactions */}
        {!isInstagram && !isTwitter && card.submission_id && (
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <ReactionBar submissionId={card.submission_id} />
          </div>
        )}
      </div>

      {/* Journal - bottom sheet */}
      <div className="bg-white rounded-t-3xl max-h-[40vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          {card.journal_question && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Question</h4>
              <p className="text-gray-700 font-medium italic">{card.journal_question}</p>
            </div>
          )}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-lg">Your Reflection</h4>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div>
              <textarea
                value={editedJournal}
                onChange={(e) => setEditedJournal(e.target.value)}
                className="w-full bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder={card.is_submission ? "Add your reflection..." : "Write your reflection (min 10 characters)"}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveJournal}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {!card.is_submission && (
                <p className="text-xs text-gray-500 mt-2">Minimum 10 characters required</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{card.journal_text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThumbnailCard({ card, onClick }) {
  const thumbnail = getYouTubeThumbnail(card.video_link)
  const isInstagram = isInstagramUrl(card.video_link)
  const isTwitter = isTwitterUrl(card.video_link)
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="group relative">
      <div
        onClick={() => onClick(card)}
        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
      >
        {thumbnail ? (
          <>
            <img src={thumbnail} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : isInstagram ? (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
          </div>
        ) : isTwitter ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
            <p className="text-white font-bold text-sm">✨</p>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-gray-900 ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Category badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white bg-gradient-to-r ${color} shadow-sm`}>
          {label}
        </div>
      </div>

      {/* Info below thumbnail */}
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
          {card.journal_text?.substring(0, 60)}{card.journal_text?.length > 60 ? '...' : ''}
        </p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  )
}

export default function CollectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortMode, setSortMode] = useState('newest')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadCollection()

      // Track collection page view
      trackEvent(EVENTS.COLLECTION_VIEWED)
    }
  }, [status])

  const loadCollection = async () => {
    try {
      const response = await fetch('/api/collection')
      const data = await response.json()
      setCards(data.cards || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = (cardId) => {
    // Optimistically remove from state
    setCards(prevCards => prevCards.filter(c => c.id !== cardId))

    // Update stats
    setStats(prevStats => prevStats ? {
      ...prevStats,
      total: prevStats.total - 1
    } : null)
  }

  const handleUpdateCard = (cardId, updates) => {
    // Optimistically update in state
    setCards(prevCards =>
      prevCards.map(c =>
        c.id === cardId ? { ...c, ...updates } : c
      )
    )
  }

  const getSortedCards = (cardsToSort) => {
    const sorted = [...cardsToSort]

    switch (sortMode) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.kept_at) - new Date(b.kept_at))
      case 'category':
        return sorted.sort((a, b) => {
          const labelA = categoryLabels[a.category] || a.category
          const labelB = categoryLabels[b.category] || b.category
          return labelA.localeCompare(labelB)
        })
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.kept_at) - new Date(a.kept_at))
    }
  }

  const filteredCards = getSortedCards(
    activeFilter === 'all' ? cards : cards.filter(c => c.category === activeFilter)
  )
  const uniqueCategories = [...new Set(cards.map(c => c.category))]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your collection...</p>
      </div>
    )
  }

  if (!session) return null

  const milestoneProgress = stats ? getMilestoneProgress(stats.total) : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <button onClick={() => router.push('/cards')} className="text-2xl font-bold hover:text-gray-700 transition-colors">Awed</button>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/cards')} className="text-sm text-gray-600 hover:text-gray-900">Today's Cards</button>
            <button onClick={() => router.push('/profile')} className="text-sm text-gray-600 hover:text-gray-900">Profile</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">My Collection</h2>
          <p className="text-gray-600 text-sm">Your personal awe moments</p>
        </div>

        {stats && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <div>
                <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Cards</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold">🔥 {stats.streak}</p>
                <p className="text-xs text-gray-500 mt-1">Streak</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold">{stats.categories}/8</p>
                <p className="text-xs text-gray-500 mt-1">Categories</p>
              </div>
            </div>
            {milestoneProgress && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{stats.total} cards</span>
                  <span>Next: {milestoneProgress.next}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${milestoneProgress.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {milestoneProgress.next - stats.total} cards to next milestone
                </p>
              </div>
            )}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🎴</p>
            <h3 className="text-xl font-bold mb-2">No cards yet</h3>
            <p className="text-gray-600 mb-6 text-sm">Start collecting awe moments today!</p>
            <button onClick={() => router.push('/cards')} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium">
              View Today's Cards
            </button>
          </div>
        ) : (
          <>
            {/* Sort dropdown */}
            <div className="mb-4 flex justify-end">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">Category (A-Z)</option>
              </select>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'
                }`}
              >
                All ({cards.length})
              </button>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCards.map((card) => (
                <ThumbnailCard key={card.card_id} card={card} onClick={setSelectedCard} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />

      {selectedCard && (
        <FullscreenCardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDelete={handleDeleteCard}
          onUpdate={handleUpdateCard}
        />
      )}
    </div>
  )
}