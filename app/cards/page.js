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

function ReactionBar({ submissionId }) {
  const [reaction, setReaction] = useState(null)
  const [awedCount, setAwedCount] = useState(0)
  const [nawedCount, setNawedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!submissionId) return
    fetch(`/api/moment-reactions?submissionId=${submissionId}`)
      .then(r => r.json())
      .then(data => {
        setAwedCount(data.awedCount || 0)
        setNawedCount(data.nawedCount || 0)
        setReaction(data.userReaction || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
    <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-100">
      <button
        onClick={() => handleReaction('awed')}
        className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all active:scale-95 ${reaction === 'awed' ? 'border-yellow-400 bg-yellow-50 scale-105' : 'border-gray-200 bg-white hover:border-yellow-300'}`}
      >
        <img src="/awed-emoji.png" alt="awed" width={28} height={28} />
        <span className="font-medium text-sm">Awed</span>
        {awedCount > 0 && <span className="text-sm text-gray-500">{awedCount}</span>}
      </button>
      <button
        onClick={() => handleReaction('nawed')}
        className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all active:scale-95 ${reaction === 'nawed' ? 'border-blue-400 bg-blue-50 scale-105' : 'border-gray-200 bg-white hover:border-blue-300'}`}
      >
        <img src="/nawed-emoji.png" alt="nawed" width={28} height={28} />
        <span className="font-medium text-sm">Nawed</span>
        {nawedCount > 0 && <span className="text-sm text-gray-500">{nawedCount}</span>}
      </button>
    </div>
  )
}

function CardModal({ card, onClose, onKeep, alreadyKeptToday, isSubmissionCard }) {
  const [journalText, setJournalText] = useState(isSubmissionCard ? 'I submitted this awe moment ✨' : '')
  const [isPublic, setIsPublic] = useState(false)
  const [keeping, setKeeping] = useState(false)
  const [kept, setKept] = useState(card.isKept || isSubmissionCard)
  const [streak, setStreak] = useState(null)

  const videoId = getYouTubeId(card.video?.videoLink || card.video_link)
  const canKeep = journalText.trim().length >= 10

  const handleKeep = async () => {
    if (!canKeep || keeping) return
    setKeeping(true)
    try {
      const response = await fetch('/api/cards/keep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: card.video?.id || card.submission_id,
          journalText: journalText.trim(),
          isPublic,
          isSubmission: false
        })
      })
      const data = await response.json()
      if (data.success) {
        setKept(true)
        setStreak(data.streak)
        onKeep()
      } else {
        alert(data.error || 'Error keeping card')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setKeeping(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end md:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-3xl md:rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold">{card.label || card.category}</h3>
            {isSubmissionCard && (
              <p className="text-sm text-purple-600 font-medium">⭐ Your submission</p>
            )}
            {kept && streak && (
              <p className="text-sm text-orange-500 font-medium">🔥 {streak} day streak!</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none w-10 h-10 flex items-center justify-center">×</button>
        </div>

        <div className="p-4 md:p-6">
          {videoId ? (
            <div className="aspect-video mb-4 rounded-xl overflow-hidden">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} title={card.label} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <div className="aspect-video mb-4 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Video unavailable</p>
            </div>
          )}

          {(card.video?.id || card.submission_id) && (
            <ReactionBar submissionId={card.video?.id || card.submission_id} />
          )}

          {/* Submission card - already in collection */}
          {isSubmissionCard ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center mt-4">
              <p className="text-2xl mb-2">⭐</p>
              <p className="text-purple-800 font-bold text-lg mb-1">Your Submission!</p>
              <p className="text-gray-600 text-sm">This moment is already in your collection. Thank you for contributing to Awed!</p>
            </div>
          ) : kept ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mt-4">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-green-800 font-bold text-lg mb-1">Card Kept!</p>
              {streak && <p className="text-orange-500 font-medium text-sm">🔥 {streak} day streak!</p>}
              <button onClick={onClose} className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">Explore more cards →</button>
            </div>
          ) : (
            <div className="mt-4">
              {alreadyKeptToday && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-blue-800 text-sm">You've already kept a card today. Come back tomorrow!</p>
                </div>
              )}
              {!alreadyKeptToday && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">How does this moment make you feel?</label>
                    <textarea
                      value={journalText}
                      onChange={e => setJournalText(e.target.value)}
                      placeholder="Write your reflection here..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                    />
                    {!canKeep && journalText.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{10 - journalText.trim().length} more characters needed</p>
                    )}
                  </div>
                  {canKeep && (
                    <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                      <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5" />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Share my reflection publicly
                        <span className="block text-xs text-gray-400">Others can read your journal entry</span>
                      </label>
                    </div>
                  )}
                  <button
                    onClick={handleKeep}
                    disabled={!canKeep || keeping}
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-all text-base active:scale-95 ${canKeep ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    {keeping ? 'Keeping...' : canKeep ? 'Keep This Card ✨' : 'Write to keep this card'}
                  </button>
                </>
              )}
            </div>
          )}
          <div className="h-4 md:hidden" />
        </div>
      </div>
    </div>
  )
}

function AweCard({ card, onClick }) {
  return (
    <div
      onClick={() => !card.isEmpty && onClick(card)}
      className={`relative aspect-[3/4] rounded-2xl shadow-lg transition-all duration-200 ${
        card.isEmpty ? 'cursor-default opacity-60' : card.isKept ? 'cursor-pointer opacity-75' : 'cursor-pointer active:scale-95 hover:scale-105 hover:shadow-xl'
      }`}
    >
      {card.isEmpty ? (
        <div className="w-full h-full bg-gray-100 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300">
          <p className="text-gray-400 font-medium text-center text-sm mb-1">{card.label}</p>
          <p className="text-gray-400 text-xs text-center">No moments yet</p>
        </div>
      ) : card.isKept ? (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-2xl flex flex-col items-center justify-center p-4`}>
          <p className="text-white text-2xl mb-2">✨</p>
          <p className="text-white font-bold text-center text-sm">{card.label}</p>
          <p className="text-white text-xs mt-2 opacity-75">Kept today</p>
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-2xl flex flex-col items-center justify-center p-4`}>
          <p className="text-white font-bold text-center text-sm drop-shadow">{card.label}</p>
          <p className="text-white text-xs mt-2 opacity-75">Tap to reveal</p>
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ card, onClick }) {
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
  const color = categoryColors[card.category] || 'from-gray-400 to-gray-600'
  const label = categoryLabels[card.category] || card.category

  return (
    <div
      onClick={() => onClick(card)}
      className="relative aspect-[3/4] rounded-2xl shadow-lg cursor-pointer active:scale-95 hover:scale-105 hover:shadow-xl transition-all duration-200"
    >
      <div className={`w-full h-full bg-gradient-to-br ${color} rounded-2xl flex flex-col items-center justify-center p-4`}>
        <p className="text-white text-xl mb-1">⭐</p>
        <p className="text-white font-bold text-center text-xs drop-shadow leading-tight">{label}</p>
        <p className="text-white text-xs mt-2 opacity-75">Your submission</p>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [submissionSlots, setSubmissionSlots] = useState([])
  const [submissionPoints, setSubmissionPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [isSubmissionCard, setIsSubmissionCard] = useState(false)
  const [keptToday, setKeptToday] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadCards()
  }, [status])

  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards/today')
      const data = await response.json()
      if (data.cards) {
        setCards(data.cards)
        setKeptToday(!!data.keptCard)
        setSubmissionSlots(data.submissionSlots || [])
        setSubmissionPoints(data.submissionPoints || 0)
      }
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeep = () => {
    setKeptToday(true)
    loadCards()
  }

  const handleCardClick = (card, isSubmission = false) => {
    setSelectedCard(card)
    setIsSubmissionCard(isSubmission)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading your cards...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <h1 className="text-2xl font-bold">Awed</h1>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => router.push('/collection')} className="text-sm text-gray-600 hover:text-gray-900">Collection</button>
            <button onClick={() => router.push('/profile')} className="text-sm text-gray-600 hover:text-gray-900">Profile</button>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="md:hidden text-sm text-gray-400">Sign Out</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">

        {/* Daily curated cards */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Today's Awe Moments</h2>
          <p className="text-gray-600 text-sm md:text-base">
            {keptToday ? "You've kept a card today. Come back tomorrow! ✨" : "Choose a card to reveal your awe moment"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          {cards.map(card => (
            <AweCard key={card.category} card={card} onClick={c => handleCardClick(c, false)} />
          ))}
        </div>

        {/* Submission slots */}
        {submissionSlots.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Your Submissions</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                ⭐ {submissionPoints} point{submissionPoints !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              These moments are permanently in your collection — one per approved submission.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {submissionSlots.map(card => (
                <SubmissionCard key={card.card_id} card={card} onClick={c => handleCardClick(c, true)} />
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav />

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => { setSelectedCard(null); setIsSubmissionCard(false) }}
          onKeep={handleKeep}
          alreadyKeptToday={keptToday && !selectedCard.isKept}
          isSubmissionCard={isSubmissionCard}
        />
      )}
    </div>
  )
}