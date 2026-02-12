'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
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

const milestones = [10, 50, 100, 500, 1000]

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
      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
        active
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <Image
        src={`/${type}-emoji.png`}
        alt={type}
        width={24}
        height={24}
      />
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
        body: JSON.stringify({
          userCardId: journal.id,
          reactionType: type
        })
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
          const prev = reaction
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
      <p className="text-gray-700 text-sm leading-relaxed mb-3">
        {journal.journal_text}
      </p>
      {!isOwn && (
        <div className="flex gap-2">
          <ReactionButton
            type="awed"
            count={awedCount}
            active={reaction === 'awed'}
            onClick={() => handleReaction('awed')}
          />
          <ReactionButton
            type="nawed"
            count={nawedCount}
            active={reaction === 'nawed'}
            onClick={() => handleReaction('nawed')}
          />
        </div>
      )}
    </div>
  )
}

function CardDetailModal({ card, onClose, userId }) {
  const videoId = getYouTubeId(card.video_link)
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const [showOthers, setShowOthers] = useState(false)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored header */}
        <div className={`bg-gradient-to-r ${color} px-6 py-4 rounded-t-2xl flex justify-between items-center`}>
          <div>
            <h3 className="text-xl font-bold text-white">{label}</h3>
            <p className="text-white text-sm opacity-80">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-3xl leading-none opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Video */}
          {videoId ? (
            <div className="aspect-video mb-6 rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={label}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Video unavailable</p>
            </div>
          )}

          {/* Your journal */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Your Reflection
            </h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{card.journal_text}</p>
            </div>
          </div>

          {/* Others' journals - collapsible */}
          {card.public_journals && card.public_journals.length > 0 && (
            <div>
              <button
                onClick={() => setShowOthers(!showOthers)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-600">
                  What others felt ({card.public_journals.length})
                </span>
                <span className="text-gray-400">
                  {showOthers ? '▲' : '▼'}
                </span>
              </button>

              {showOthers && (
                <div className="mt-3 space-y-3">
                  {card.public_journals.map((journal, index) => (
                    <PublicJournalCard
                      key={index}
                      journal={journal}
                      currentUserId={userId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CollectionCard({ card, onClick }) {
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category
  const date = new Date(card.kept_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  return (
    <div
      onClick={() => onClick(card)}
      className="relative aspect-[3/4] rounded-2xl shadow-md cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-200"
    >
      <div className={`w-full h-full bg-gradient-to-br ${color} rounded-2xl flex flex-col items-center justify-center p-4`}>
        <p className="text-white text-2xl mb-2">✨</p>
        <p className="text-white font-bold text-center text-sm drop-shadow">
          {label}
        </p>
        <p className="text-white text-xs mt-2 opacity-75">{date}</p>
        {card.is_public && (
          <p className="text-white text-xs mt-1 opacity-75">🌍 Public</p>
        )}
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadCollection()
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

  const filteredCards = activeFilter === 'all'
    ? cards
    : cards.filter(c => c.category === activeFilter)

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <h1 className="text-2xl font-bold">Awed</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/cards')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Today's Cards
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">My Collection</h2>
          <p className="text-gray-600">Your personal awe moments</p>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Cards Collected</p>
              </div>
              <div>
                <p className="text-3xl font-bold">🔥 {stats.streak}</p>
                <p className="text-sm text-gray-500 mt-1">Day Streak</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.categories}/8</p>
                <p className="text-sm text-gray-500 mt-1">Categories</p>
              </div>
            </div>

            {milestoneProgress && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{stats.total} cards</span>
                  <span>Next milestone: {milestoneProgress.next} cards</span>
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

        {/* Empty state */}
        {cards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🎴</p>
            <h3 className="text-xl font-bold mb-2">No cards yet</h3>
            <p className="text-gray-600 mb-6">
              Start collecting awe moments today!
            </p>
            <button
              onClick={() => router.push('/cards')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium"
            >
              View Today's Cards
            </button>
          </div>
        ) : (
          <>
            {/* Category filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({cards.length})
              </button>
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredCards.map((card) => (
                <CollectionCard
                  key={card.id}
                  card={card}
                  onClick={setSelectedCard}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          userId={session?.user?.id}
        />
      )}
    </div>
  )
}