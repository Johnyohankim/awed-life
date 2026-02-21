'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import BottomNav from '../components/BottomNav'
import { TIME_HORIZONS } from '../lib/exploreActivities'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../lib/constants'

function ExploreCard({ card, onSave, keptToday, queueFull, isFlipped, onFlip }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (card.allDone) {
    return (
      <div className="relative aspect-[3/4] rounded-xl shadow-md opacity-60">
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
          <p className="text-white text-2xl mb-2">✅</p>
          <p className="text-white font-bold text-xs text-center">{card.label}</p>
          <p className="text-white text-[10px] mt-1 opacity-90">All collected!</p>
        </div>
      </div>
    )
  }

  const horizon = TIME_HORIZONS[card.activity?.horizon]

  const handleSave = async (e) => {
    e.stopPropagation()
    if (saving || keptToday || saved || queueFull) return
    setSaving(true)
    const success = await onSave(card)
    if (success) setSaved(true)
    setSaving(false)
  }

  return (
    <div
      onClick={() => !isFlipped && onFlip()}
      className="relative aspect-[3/4] cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front - category card */}
        <div
          className={`absolute inset-0 rounded-xl shadow-md ${
            saved ? 'opacity-75' : 'active:scale-95 hover:scale-105 hover:shadow-lg'
          } transition-all duration-200`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-center p-3`}>
            {saved ? (
              <>
                <p className="text-white text-xl mb-1">✨</p>
                <p className="text-white font-bold text-center text-xs">{card.label}</p>
                <p className="text-white text-xs mt-1 opacity-75">Saved</p>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-center text-xs drop-shadow">{card.label}</p>
                <p className="text-white text-xs mt-1 opacity-75">Tap</p>
              </>
            )}
          </div>
        </div>

        {/* Back - activity revealed */}
        <div
          className="absolute inset-0 rounded-xl shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-xl flex flex-col items-center justify-between p-3 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20 rounded-xl" />
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center">
              {/* Horizon badge */}
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-medium border border-white/20 mb-2">
                {horizon?.emoji} {horizon?.label}
              </span>
              {/* Activity text */}
              <p className="text-white font-semibold text-sm leading-snug drop-shadow px-1">
                {card.activity?.text}
              </p>
            </div>
            {/* Save button */}
            <div className="relative z-10 w-full mt-2">
              {saved ? (
                <div className="w-full py-2 rounded-lg bg-white/20 text-white text-xs font-medium text-center">
                  ✨ Saved
                </div>
              ) : keptToday ? (
                <div className="w-full py-2 rounded-lg bg-black/20 text-white/60 text-[10px] text-center">
                  1 save per day
                </div>
              ) : queueFull ? (
                <div className="w-full py-2 rounded-lg bg-black/20 text-white/60 text-[10px] text-center">
                  3 walks queued
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2 rounded-lg bg-white/90 text-gray-900 text-xs font-semibold active:scale-95 transition-all hover:bg-white"
                >
                  {saving ? '...' : 'Save ✨'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedExploreCard({ card, onSave, keptToday, queueFull, isFlipped, onFlip }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (card.allDone) {
    return (
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl shadow-xl opacity-60">
        <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-8`}>
          <p className="text-white text-4xl md:text-5xl mb-3">✅</p>
          <p className="text-white font-bold text-xl md:text-2xl">{card.label}</p>
          <p className="text-white text-sm mt-2 opacity-90">All walks collected!</p>
        </div>
      </div>
    )
  }

  const horizon = TIME_HORIZONS[card.activity?.horizon]

  const handleSave = async (e) => {
    e.stopPropagation()
    if (saving || keptToday || saved || queueFull) return
    setSaving(true)
    const success = await onSave(card)
    if (success) setSaved(true)
    setSaving(false)
  }

  return (
    <div
      onClick={() => !isFlipped && onFlip()}
      className="relative aspect-[16/9] md:aspect-[21/9] cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-600`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-3xl shadow-xl ${
            saved ? 'opacity-75' : 'active:scale-[0.98] hover:scale-[1.02] hover:shadow-2xl'
          } transition-all duration-200`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden`}>
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/30">
              Today's Explore
            </div>
            <div className="text-center max-w-3xl">
              {saved ? (
                <>
                  <p className="text-white text-4xl md:text-5xl mb-3">✨</p>
                  <p className="text-white font-bold text-xl md:text-2xl">{card.label}</p>
                  <p className="text-white text-sm mt-3 opacity-75">Saved to My Walks</p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg mb-4">{card.label}</p>
                  <p className="text-white text-sm md:text-base opacity-90 italic leading-relaxed mb-4 drop-shadow">
                    {card.subtitle}
                  </p>
                  <p className="text-white text-sm md:text-base opacity-80 font-medium">Tap to reveal your awe walk</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-3xl flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/25 rounded-3xl" />
            <div className="relative z-10 text-center max-w-3xl">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/20 mb-4">
                {horizon?.emoji} {horizon?.label}
              </span>
              <p className="text-white font-bold text-xl md:text-2xl leading-snug drop-shadow mb-6">
                {card.activity?.text}
              </p>
              {saved ? (
                <div className="inline-block px-6 py-3 rounded-xl bg-white/20 text-white font-medium text-sm">
                  ✨ Saved to My Walks
                </div>
              ) : keptToday ? (
                <div className="inline-block px-6 py-3 rounded-xl bg-black/20 text-white/60 text-sm">
                  You've already saved a walk today
                </div>
              ) : queueFull ? (
                <div className="inline-block px-6 py-3 rounded-xl bg-black/20 text-white/60 text-sm">
                  3 walks queued — complete or remove one first
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-white/90 text-gray-900 font-semibold text-sm active:scale-95 transition-all hover:bg-white shadow-lg"
                >
                  {saving ? 'Saving...' : 'Save This Walk ✨'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WalkReflectionModal({ walk, onClose, onComplete }) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDone, setChatDone] = useState(false)
  const [completing, setCompleting] = useState(false)
  const chatEndRef = useRef(null)

  const userMessages = chatMessages.filter(m => m.role === 'user')
  const canComplete = userMessages.length > 0 && userMessages.some(m => m.content.trim().length >= 5)

  const color = CATEGORY_COLORS[walk.category] || 'from-gray-400 to-gray-600'
  const label = CATEGORY_LABELS[walk.category] || walk.category
  const horizon = TIME_HORIZONS[walk.horizon]

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  // Fetch opening message
  useEffect(() => {
    fetchChatReply([])
  }, [])

  // Handle back button
  useEffect(() => {
    window.history.pushState({ modal: true }, '')
    const handlePopState = () => onClose()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [onClose])

  const fetchChatReply = async (messages) => {
    setChatLoading(true)
    try {
      const res = await fetch('/api/journal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          category: walk.category,
          type: 'walk',
          activityText: walk.activity_text,
        })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (e) {
      console.error('Chat error:', e)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')

    const assistantCount = newMessages.filter(m => m.role === 'assistant').length
    if (assistantCount < 3) {
      await fetchChatReply(newMessages)
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Thank you for sharing. You can complete this walk whenever you\'re ready ✨'
        }])
        setChatDone(true)
      }, 400)
    }
  }

  const handleComplete = async () => {
    if (!canComplete || completing) return
    setCompleting(true)

    const openingQuestion = chatMessages.find(m => m.role === 'assistant')?.content || ''
    const afterOpening = chatMessages.slice(chatMessages.findIndex(m => m.role === 'assistant') + 1)
    const reflectionText = afterOpening
      .filter(m => m.role !== 'assistant' || !m.content.startsWith('Thank you for sharing.'))
      .map(m => m.role === 'assistant' ? `Guide: ${m.content}` : `You: ${m.content}`)
      .join('\n\n')

    try {
      const res = await fetch('/api/explore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: walk.activity_id,
          reflectionText,
        })
      })
      const data = await res.json()
      if (data.success) {
        onComplete(walk.activity_id)
      } else {
        alert(data.error || 'Error completing walk')
      }
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Walk info header */}
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
              <p className="text-white/70 text-xs mt-1">{label}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all flex-shrink-0 ml-3"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                <span className="text-gray-400 text-sm tracking-widest">···</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          {!chatDone && (
            <div className="flex gap-2 mb-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="How did the walk go?"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
              >
                →
              </button>
            </div>
          )}

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-700"
            >
              {completing ? 'Completing...' : 'Complete Walk ✨'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState([])
  const [totalKept, setTotalKept] = useState(0)
  const [keptToday, setKeptToday] = useState(false)
  const [plannedWalks, setPlannedWalks] = useState([])
  const [plannedCount, setPlannedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [flippedCards, setFlippedCards] = useState(new Set())
  const [reflectingWalk, setReflectingWalk] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadExplore()
  }, [status])

  const loadExplore = async () => {
    try {
      const localDate = new Date().toLocaleDateString('en-CA')
      const res = await fetch(`/api/explore?localDate=${localDate}`)
      const data = await res.json()
      if (data.cards) {
        setCards(data.cards)
        setKeptToday(data.keptToday || false)
        setTotalKept(data.totalKept || 0)
        setPlannedWalks(data.plannedWalks || [])
        setPlannedCount(data.plannedCount || 0)
      }
    } catch (error) {
      console.error('Error loading explore:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = (category) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      next.add(category)
      return next
    })
  }

  const handleSave = async (card) => {
    try {
      const localDate = new Date().toLocaleDateString('en-CA')
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: card.activity.id,
          category: card.category,
          horizon: card.activity.horizon,
          activityText: card.activity.text,
          localDate,
        })
      })
      const data = await res.json()
      if (data.success) {
        setKeptToday(true)
        await loadExplore()
        return true
      } else {
        alert(data.error || 'Error saving walk')
        return false
      }
    } catch (error) {
      alert('Something went wrong')
      return false
    }
  }

  const handleCancelWalk = async (activityId) => {
    if (!confirm('Remove this planned walk?')) return
    try {
      const res = await fetch(`/api/explore?activityId=${activityId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        await loadExplore()
      }
    } catch (error) {
      console.error('Error cancelling walk:', error)
    }
  }

  const handleWalkComplete = async () => {
    setReflectingWalk(null)
    await loadExplore()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  const featuredCard = cards[0]
  const remainingCards = cards.slice(1)
  const queueFull = plannedCount >= 3

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
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Explore Awe</h2>
          <p className="text-gray-500 text-sm md:text-base mb-2">
            {keptToday
              ? 'You\'ve saved a walk today. Come back tomorrow for more! ✨'
              : 'Flip a card. Save a walk you want to try. Reflect after you\'ve done it.'
            }
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
            <span className="text-blue-700 text-sm font-medium">
              {totalKept} completed
            </span>
            {plannedCount > 0 && (
              <span className="text-cyan-700 text-sm font-medium">
                {plannedCount} planned
              </span>
            )}
          </div>
        </div>

        {/* My Walks — planned walks section */}
        {plannedWalks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">My Walks</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{plannedCount}/3</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {plannedWalks.map(walk => {
                const walkColor = CATEGORY_COLORS[walk.category] || 'from-gray-400 to-gray-600'
                const walkLabel = CATEGORY_LABELS[walk.category] || walk.category
                const walkHorizon = TIME_HORIZONS[walk.horizon]
                return (
                  <div key={walk.activity_id} className="flex-shrink-0 w-64">
                    <div className={`bg-gradient-to-br ${walkColor} rounded-xl p-4 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/15 rounded-xl" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-medium border border-white/20">
                            {walkHorizon?.emoji} {walkHorizon?.label}
                          </span>
                          <button
                            onClick={() => handleCancelWalk(walk.activity_id)}
                            className="w-6 h-6 rounded-full bg-black/20 text-white/70 text-xs flex items-center justify-center hover:bg-black/30"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-white font-semibold text-sm leading-snug mb-1 drop-shadow">
                          {walk.activity_text}
                        </p>
                        <p className="text-white/60 text-xs mb-3">{walkLabel}</p>
                        <button
                          onClick={() => setReflectingWalk(walk)}
                          className="w-full py-2 rounded-lg bg-white/90 text-gray-900 text-xs font-semibold active:scale-95 transition-all hover:bg-white"
                        >
                          Done it? Reflect 💬
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Featured card */}
        {featuredCard && (
          <div className="mb-6">
            <FeaturedExploreCard
              card={featuredCard}
              onSave={handleSave}
              keptToday={keptToday}
              queueFull={queueFull}
              isFlipped={flippedCards.has(featuredCard.category)}
              onFlip={() => handleFlip(featuredCard.category)}
            />
          </div>
        )}

        {/* Remaining cards grid */}
        {remainingCards.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {remainingCards.map(card => (
              <ExploreCard
                key={card.category}
                card={card}
                onSave={handleSave}
                keptToday={keptToday}
                queueFull={queueFull}
                isFlipped={flippedCards.has(card.category)}
                onFlip={() => handleFlip(card.category)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {reflectingWalk && (
        <WalkReflectionModal
          walk={reflectingWalk}
          onClose={() => setReflectingWalk(null)}
          onComplete={handleWalkComplete}
        />
      )}
    </div>
  )
}
