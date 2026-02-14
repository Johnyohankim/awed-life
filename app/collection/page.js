'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

function isInstagramUrl(url) {
  return url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p/'))
}

function isTwitterUrl(url) {
  return url && (url.includes('twitter.com') || url.includes('x.com'))
}

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

const milestones = [5, 15, 30, 75, 150, 300, 500]

function getMilestoneProgress(total) {
  const next = milestones.find(m => m > total) || milestones[milestones.length - 1]
  const prev = milestones[milestones.indexOf(next) - 1] || 0
  const progress = ((total - prev) / (next - prev)) * 100
  return { next, prev, progress: Math.min(progress, 100) }
}

function ReactionButton({ type, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all active:scale-95 ${
        active
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <img src={`/${type}-emoji.png`} alt={type} width={24} height={24} />
      <span className="font-medium text-sm capitalize">{type}</span>
      {count > 0 && (
        <span className={`text-sm ${active ? 'text-blue-600' : 'text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function PublicJournalCard({ journal, currentUserId }) {
  const [reaction, setReaction] = useState(journal.userReaction || null)
  const [awedCount, setAwedCount] = useState(journal.awed_count || 0)
  const [nawedCount, setNawedCount] = useState(journal.nawed_count || 0)
  const isOwn = journal.user_id === currentUserId

  const handleReaction = async (type) => {
    if (isOwn) return
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardId: journal.id, reactionType: type })
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
          if (type === 'awed') {
            setAwedCount(p => p + 1)
            setNawedCount(p => Math.max(p - 1, 0))
          } else {
            setNawedCount(p => p + 1)
            setAwedCount(p => Math.max(p - 1, 0))
          }
        }
      }
    } catch (error) {
      console.error('Reaction error:', error)
    }
  }

  return (
    <div className="bg-blue-50 rounded-xl p-4">
      <p className="text-gray-700 text-sm leading-relaxed mb-3">{journal.journal_text}</p>
      {!isOwn && (
        <div className="flex gap-2">
          <ReactionButton type="awed" count={awedCount} active={reaction === 'awed'} onClick={() => handleReaction('awed')} />
          <ReactionButton type="nawed" count={nawedCount} active={reaction === 'nawed'} onClick={() => handleReaction('nawed')} />
        </div>
      )}
    </div>
  )
}

function CardDetailModal({ card, onClose, userId }) {
  const videoId = getYouTubeId(card.video_link)
  const isInstagram = isInstagramUrl(card.video_link)
  const isTwitter = isTwitterUrl(card.video_link)
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const [showOthers, setShowOthers] = useState(false)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-end md:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className={`bg-gradient-to-r ${color} px-6 py-4 flex justify-between items-center`}>
          <div>
            <h3 className="text-xl font-bold text-white">{label}</h3>
            <p className="text-white text-sm opacity-80">{date}</p>
          </div>
          <button onClick={onClose} className="text-white text-3xl leading-none opacity-75 w-10 h-10 flex items-center justify-center">×</button>
        </div>

        <div className="p-4 md:p-6">
          {isInstagram ? (
            <a
              href={card.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-video mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white mb-2">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              <p className="text-white font-bold text-lg">Watch on Instagram</p>
              <p className="text-white text-sm mt-1 opacity-75">Tap to open ↗</p>
            </a>
          ) : isTwitter ? (
            <a
              href={card.video_link}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-video mb-6 rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white mb-2">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <p className="text-white font-bold text-lg">Watch on X</p>
              <p className="text-white text-sm mt-1 opacity-75">Tap to open ↗</p>
            </a>
          ) : videoId ? (
            <div className="aspect-video mb-6 rounded-xl overflow-hidden">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title={label} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <div className="aspect-video mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Video unavailable</p>
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Reflection</h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{card.journal_text}</p>
            </div>
          </div>

          {card.public_journals && card.public_journals.length > 0 && (
            <div>
              <button
                onClick={() => setShowOthers(!showOthers)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-600">
                  What others felt ({card.public_journals.length})
                </span>
                <span className="text-gray-400">{showOthers ? '▲' : '▼'}</span>
              </button>
              {showOthers && (
                <div className="mt-3 space-y-3">
                  {card.public_journals.map((journal, index) => (
                    <PublicJournalCard key={index} journal={journal} currentUserId={userId} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="h-4 md:hidden" />
        </div>
      </div>
    </div>
  )
}

function CollectionCard({ card, onClick, onShare }) {
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="relative">
      <div
        onClick={() => onClick(card)}
        className="relative aspect-[3/4] rounded-2xl shadow-md cursor-pointer active:scale-95 hover:scale-105 hover:shadow-xl transition-all duration-200"
      >
        <div className={`w-full h-full bg-gradient-to-br ${color} rounded-2xl flex flex-col items-center justify-center p-4`}>
          <p className="text-white text-2xl mb-2">✨</p>
          <p className="text-white font-bold text-center text-sm drop-shadow">{label}</p>
          <p className="text-white text-xs mt-2 opacity-75">{date}</p>
          {card.is_public && <p className="text-white text-xs mt-1 opacity-75">🌍 Public</p>}
        </div>
      </div>

      {card.is_public && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(card) }}
          className="absolute bottom-2 right-2 bg-white bg-opacity-90 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-opacity-100 active:scale-95 transition-all"
          title="Share"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-600">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
      )}
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadCollection()
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

  const handleShare = (card) => {
    window.open(`/share/${card.card_id}`, '_blank')
  }

  const filteredCards = activeFilter === 'all' ? cards : cards.filter(c => c.category === activeFilter)
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
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <h1 className="text-2xl font-bold">Awed</h1>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/cards')} className="text-sm text-gray-600 hover:text-gray-900">Today's Cards</button>
            <button onClick={() => router.push('/profile')} className="text-sm text-gray-600 hover:text-gray-900">Profile</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
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
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
                }`}
              >
                All ({cards.length})
              </button>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {filteredCards.map((card) => (
                <CollectionCard key={card.card_id} card={card} onClick={setSelectedCard} onShare={handleShare} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} userId={session?.user?.id} />
      )}
    </div>
  )
}