'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import EngagementCalendar from '../components/EngagementCalendar'
import AweraCircle from '../components/AweraCircle'
import { CATEGORY_COLORS, CATEGORY_LABELS, MILESTONES } from '../lib/constants'
import { trackEvent, EVENTS } from '../lib/analytics'
import { TIME_HORIZONS } from '../lib/exploreActivities'

function getYouTubeId(url) {
  if (!url) return null

  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
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

function AvatarCircle({ name, size = 'lg' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg'
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-[#C97B84] to-[#957BA8] flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
      {initial}
    </div>
  )
}

const MILESTONE_DATA = [
  { count: 5, label: 'First Pause', emoji: '🌱' },
  { count: 15, label: 'Gentle Noticer', emoji: '🌿' },
  { count: 30, label: 'Steady Witness', emoji: '🌾' },
  { count: 75, label: 'Open Observer', emoji: '🌤' },
  { count: 150, label: 'Deepening Presence', emoji: '🌅' },
  { count: 300, label: 'Living in Wonder', emoji: '🌌' },
  { count: 500, label: 'Rooted in Awe', emoji: '🌊' },
]

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
            ? 'border-[#6B8FA8] bg-[#6B8FA8]/30'
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

function parseJournalSegments(text) {
  if (!text) return [{ type: 'plain', text: '' }]
  if (!text.includes('Guide: ') && !text.includes('You: ')) return [{ type: 'plain', text }]
  return text.split('\n\n').map(chunk => {
    if (chunk.startsWith('Guide: ')) return { type: 'guide', text: chunk.slice(7) }
    if (chunk.startsWith('You: ')) return { type: 'user', text: chunk.slice(5) }
    return { type: 'plain', text: chunk }
  })
}

function FullscreenCardModal({ card, onClose, onDelete, onUpdate }) {
  const videoId = getYouTubeId(card.video_link)
  const isInstagram = isInstagramUrl(card.video_link)
  const isTwitter = isTwitterUrl(card.video_link)
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentJournalText, setCurrentJournalText] = useState(card.journal_text)
  const [editSegments, setEditSegments] = useState(() => parseJournalSegments(card.journal_text))
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
    const userText = editSegments.filter(s => s.type !== 'guide').map(s => s.text).join(' ')
    if (!card.is_submission && userText.trim().length < 10) {
      alert('Your responses must be at least 10 characters')
      return
    }

    const journalText = editSegments.map(s => {
      if (s.type === 'guide') return `Guide: ${s.text}`
      if (s.type === 'user') return `You: ${s.text}`
      return s.text
    }).join('\n\n')

    setSaving(true)
    try {
      const response = await fetch('/api/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, journalText })
      })
      const data = await response.json()

      if (data.success) {
        onUpdate(card.id, { journal_text: journalText })
        setCurrentJournalText(journalText)
        setEditSegments(parseJournalSegments(journalText))
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
    setEditSegments(parseJournalSegments(currentJournalText))
    setIsEditing(false)
  }

  useEffect(() => {
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ overscrollBehavior: 'contain' }}>
      <div className="flex-1 relative">
        {isInstagram ? (
          <a
            href={card.video_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full bg-gradient-to-br from-[#C4A8D4] via-[#E8B4B8] to-[#E8C4A0] flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
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
          <div className="w-full h-full bg-surface-dark flex items-center justify-center">
            <p className="text-white">Video unavailable</p>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-lg drop-shadow">{label}</h3>
                {card.is_submission && !card.approved && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold text-amber-900 bg-amber-300 border border-amber-400">
                    ⏳ Pending
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm">{date}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center justify-center text-white hover:bg-red-500/30 transition-all disabled:opacity-50"
                title="Delete card"
                aria-label="Delete card"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {!isInstagram && !isTwitter && card.submission_id && (
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <ReactionBar submissionId={card.submission_id} />
          </div>
        )}
      </div>

      <div className="bg-surface-card rounded-t-3xl max-h-[40vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-border-strong rounded-full" />
          </div>
          {card.journal_question && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Question</h4>
              <p className="text-text-primary font-medium italic">{card.journal_question}</p>
            </div>
          )}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-lg">Your Reflection</h4>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-primary hover:text-primary-hover font-medium"
              >
                Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              {editSegments.map((seg, i) => {
                if (seg.type === 'guide') {
                  return (
                    <div key={i}>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">Guide</p>
                      <p className="text-text-muted text-sm italic leading-relaxed">{seg.text}</p>
                    </div>
                  )
                }
                return (
                  <div key={i}>
                    {seg.type === 'user' && (
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">You</p>
                    )}
                    <textarea
                      value={seg.text}
                      onChange={e => setEditSegments(prev => prev.map((s, j) => j === i ? { ...s, text: e.target.value } : s))}
                      className="w-full bg-surface rounded-xl p-3 text-text-primary text-sm leading-relaxed border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={seg.type === 'user' ? 2 : 4}
                      placeholder={card.is_submission ? "Add your reflection..." : "Write your reflection (min 10 characters)"}
                    />
                  </div>
                )
              })}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSaveJournal}
                  disabled={saving}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 bg-primary-light text-text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary-light disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {!card.is_submission && (
                <p className="text-xs text-text-muted">Minimum 10 characters required</p>
              )}
            </div>
          ) : (
            <div className="bg-surface rounded-xl p-4 space-y-3">
              {currentJournalText?.includes('Guide: ') || currentJournalText?.includes('You: ')
                ? currentJournalText.split('\n\n').map((chunk, i) => {
                    if (chunk.startsWith('Guide: ')) {
                      return (
                        <div key={i}>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">Guide</p>
                          <p className="text-text-muted text-sm italic leading-relaxed">{chunk.slice(7)}</p>
                        </div>
                      )
                    }
                    if (chunk.startsWith('You: ')) {
                      return (
                        <div key={i}>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">You</p>
                          <p className="text-text-primary text-sm leading-relaxed">{chunk.slice(5)}</p>
                        </div>
                      )
                    }
                    return <p key={i} className="text-text-primary text-sm leading-relaxed">{chunk}</p>
                  })
                : <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{currentJournalText}</p>
              }
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
      <button
        type="button"
        onClick={() => onClick(card)}
        className="relative w-full text-left aspect-video rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-[transform,box-shadow] duration-200 active:scale-[0.98]"
      >
        {thumbnail ? (
          <>
            <img src={thumbnail} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : isInstagram ? (
          <div className="w-full h-full bg-gradient-to-br from-[#C4A8D4] via-[#E8B4B8] to-[#E8C4A0] flex items-center justify-center">
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

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-text-primary ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white bg-gradient-to-r ${color} shadow-sm`}>
          {label}
        </div>

        {card.is_submission && !card.approved && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold text-amber-900 bg-amber-300 shadow-sm border border-amber-400">
            ⏳ Pending
          </div>
        )}
      </button>

      <div className="mt-2">
        <p className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
          {card.journal_text?.substring(0, 60)}{card.journal_text?.length > 60 ? '\u2026' : ''}
        </p>
        <p className="text-xs text-text-muted">{date}</p>
      </div>
    </div>
  )
}

function WalkDetailModal({ walk, onClose }) {
  const color = categoryColors[walk.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[walk.category] || walk.category
  const horizon = TIME_HORIZONS[walk.horizon]
  const date = walk.completed_at
    ? new Date(walk.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(walk.kept_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    window.history.pushState({ modal: true }, '')
    const handlePopState = () => onClose()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ overscrollBehavior: 'contain' }}>
      {/* Walk header */}
      <div className={`bg-gradient-to-br ${color} p-6 relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/20 mb-2">
                {horizon?.emoji} {horizon?.label}
              </span>
              <p className="text-white font-bold text-lg leading-snug drop-shadow">
                {walk.activity_text}
              </p>
              <p className="text-white/70 text-xs mt-1">{label} · {date}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-colors flex-shrink-0 ml-3"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Reflection content */}
      <div className="flex-1 bg-surface-card overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-border-strong rounded-full" />
          </div>
          <h4 className="font-bold text-lg mb-3">Your Reflection</h4>
          {walk.reflection_text ? (
            <div className="bg-surface rounded-xl p-4 space-y-3">
              {walk.reflection_text.includes('Guide: ') || walk.reflection_text.includes('You: ')
                ? walk.reflection_text.split('\n\n').map((chunk, i) => {
                    if (chunk.startsWith('Guide: ')) {
                      return (
                        <div key={i}>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">Guide</p>
                          <p className="text-text-muted text-sm italic leading-relaxed">{chunk.slice(7)}</p>
                        </div>
                      )
                    }
                    if (chunk.startsWith('You: ')) {
                      return (
                        <div key={i}>
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">You</p>
                          <p className="text-text-primary text-sm leading-relaxed">{chunk.slice(5)}</p>
                        </div>
                      )
                    }
                    return <p key={i} className="text-text-primary text-sm leading-relaxed">{chunk}</p>
                  })
                : <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{walk.reflection_text}</p>
              }
            </div>
          ) : (
            <div className="bg-surface rounded-xl p-4 text-center">
              <p className="text-text-muted text-sm">No reflection recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JourneyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [cards, setCards] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortMode, setSortMode] = useState('newest')
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exploreKeeps, setExploreKeeps] = useState([])
  const [selectedWalk, setSelectedWalk] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadData()
      trackEvent(EVENTS.COLLECTION_VIEWED)
    }
  }, [status])

  const loadData = async () => {
    try {
      const [collectionRes, profileRes, exploreRes] = await Promise.all([
        fetch('/api/collection'),
        fetch('/api/profile'),
        fetch('/api/explore')
      ])

      const collectionData = await collectionRes.json()
      const profileData = await profileRes.json()
      const exploreData = await exploreRes.json()

      setCards(collectionData.cards || [])
      setStats(collectionData.stats || null)
      setProfile(profileData)
      setNewName(profileData.name || '')
      setExploreKeeps(exploreData.keeps || [])
    } catch (error) {
      console.error('Error loading data:', error)
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


  const handleDeleteCard = (cardId) => {
    setCards(prevCards => prevCards.filter(c => c.id !== cardId))
    setStats(prevStats => prevStats ? {
      ...prevStats,
      total: prevStats.total - 1
    } : null)
  }

  const handleUpdateCard = (cardId, updates) => {
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">Loading your journey\u2026</p>
      </div>
    )
  }

  if (!session || !profile) return null

  const milestoneProgress = stats ? getMilestoneProgress(stats.total) : null

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <nav className="bg-surface-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-6xl">
          <Link href="/cards" className="font-bold text-2xl hover:text-text-primary transition-colors">Awed</Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/explore" className="text-sm text-text-secondary hover:text-text-primary">Explore</Link>
            <Link href="/cards" className="text-sm text-text-secondary hover:text-text-primary">Today</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-text-secondary hover:text-text-primary">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-text-muted">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-3 py-3 max-w-6xl">
        {/* Compact Profile + Milestones */}
        <div className="bg-surface-card rounded-2xl shadow-sm p-4 mb-3">
          <div className="flex items-start gap-3 mb-3">
            <AvatarCircle name={profile.name} size="lg" />
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-lg font-bold border-b-2 border-primary outline-none w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={saving} className="text-xs text-primary font-medium whitespace-nowrap">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setNewName(profile.name) }} className="text-xs text-text-muted">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold truncate">{profile.name || 'Anonymous'}</h1>
                  <button onClick={() => setEditing(true)} className="text-text-muted text-xs flex-shrink-0">✏️</button>
                </div>
              )}
              <p className="text-text-muted text-xs">
                Since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex-shrink-0 px-3 py-1.5 border border-border rounded-lg text-xs text-text-secondary active:bg-surface"
            >
              {copied ? '✓' : '🔗'}
            </button>
          </div>
        </div>

        {/* Awera — growing circle */}
        {stats && (
          <div className="bg-surface-card rounded-2xl shadow-sm p-4 mb-3 flex flex-col items-center relative">
            <AweraCircle totalCards={stats.total} totalWalks={exploreKeeps.length} size="lg" />
            <p className="absolute bottom-3 right-3 text-[10px] text-text-muted text-right max-w-[90px] leading-tight italic">
              Moments grow Awera, walks add rays
            </p>
          </div>
        )}

        {/* Compact Stats */}
        {stats && (
          <div className="bg-surface-card rounded-2xl shadow-sm p-3 mb-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-surface rounded-lg p-2">
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-text-muted">Moments</p>
              </div>
              <div className="bg-primary-light rounded-lg p-2">
                <p className="text-xl font-bold">{exploreKeeps.length}</p>
                <p className="text-xs text-text-muted">Walks</p>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Calendar */}
        {cards.length > 0 && (
          <EngagementCalendar cards={cards} exploreKeeps={exploreKeeps} />
        )}


        {/* Awe Walks */}
        {exploreKeeps.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Awe Walks</h2>
              <span className="text-xs text-text-muted">{exploreKeeps.length} completed</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {exploreKeeps.map((keep) => {
                const color = categoryColors[keep.category] || 'from-gray-400 to-gray-600'
                const label = categoryLabels[keep.category] || keep.category
                const horizon = TIME_HORIZONS[keep.horizon]
                const date = new Date(keep.completed_at || keep.kept_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                return (
                  <div key={keep.activity_id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setSelectedWalk(keep)}
                      className={`relative w-full text-left aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-xl active:scale-[0.98] transition-[transform,box-shadow] cursor-pointer bg-gradient-to-br ${color} flex flex-col items-center justify-center p-4`}
                    >
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-medium border border-white/20 mb-2">
                        {horizon?.emoji} {horizon?.label}
                      </span>
                      <p className="text-white font-semibold text-xs text-center leading-snug drop-shadow">
                        {keep.activity_text}
                      </p>
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white bg-gradient-to-r ${color} shadow-sm`}>
                        {label}
                      </div>
                      {keep.reflection_text && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px]">
                          💬
                        </div>
                      )}
                    </button>
                    <div className="mt-2">
                      {keep.reflection_text && (
                        <p className="text-sm text-text-primary line-clamp-1 mb-0.5">
                          {keep.reflection_text.replace(/^(Guide|You): /gm, '').substring(0, 50)}\u2026
                        </p>
                      )}
                      <p className="text-xs text-text-muted">{date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Collection section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Awe Moments</h2>
          {stats && <span className="text-xs text-text-muted">{stats.total} moments</span>}
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-2xl shadow-sm">
            <p className="text-4xl mb-3">🎴</p>
            <h3 className="text-lg font-bold mb-2">No moments yet</h3>
            <p className="text-text-secondary mb-4 text-sm">Start collecting awe moments today!</p>
            <button onClick={() => router.push('/cards')} className="bg-primary text-white px-5 py-2 rounded-xl hover:bg-primary-hover font-medium text-sm">
              View Today's Moments
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex gap-2 items-center">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface-card text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="category">A-Z</option>
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary shadow-sm'
                }`}
              >
                All ({cards.length})
              </button>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeFilter === cat ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary shadow-sm'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCards.map((card) => (
                <ThumbnailCard key={card.id} card={card} onClick={setSelectedCard} />
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

      {selectedWalk && (
        <WalkDetailModal
          walk={selectedWalk}
          onClose={() => setSelectedWalk(null)}
        />
      )}

    </div>
  )
}
