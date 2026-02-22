'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../lib/constants'

const PREVIEW_CARD = {
  category: 'moral-beauty',
  label: CATEGORY_LABELS['moral-beauty'],
  videoId: '7ckfH6Sj9xk',
}

const OTHER_CATEGORIES = [
  'nature', 'music', 'collective-effervescence',
  'visual-design', 'spirituality', 'life-death', 'epiphany',
]

export default function ChatPreview() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDone, setChatDone] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const openPreview = () => {
    setOpen(true)
    setChatMessages([])
    setChatInput('')
    setChatLoading(false)
    setChatDone(false)
    fetchReply([])
  }

  const fetchReply = async (messages) => {
    setChatLoading(true)
    try {
      const res = await fetch('/api/preview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, category: PREVIEW_CARD.category })
      })
      const data = await res.json()
      if (data.reply) setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')

    const assistantCount = newMessages.filter(m => m.role === 'assistant').length
    if (assistantCount < 3) {
      await fetchReply(newMessages)
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Thank you for sharing. Sign up to keep this card and collect moments like this every day.'
        }])
        setChatDone(true)
      }, 400)
    }
  }

  const canComplete = chatMessages.filter(m => m.role === 'user').length > 0

  return (
    <>
      {/* Card row: 7 dimmed + 1 active */}
      <div className="flex items-end justify-center gap-2 overflow-x-auto pb-2 px-2">
        {OTHER_CATEGORIES.slice(0, 3).map(cat => (
          <div
            key={cat}
            className={`flex-shrink-0 w-20 md:w-24 aspect-[3/4] rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cat]} opacity-30 flex items-end justify-center p-2`}
          >
            <p className="text-white text-[10px] font-semibold text-center leading-tight drop-shadow">{CATEGORY_LABELS[cat]}</p>
          </div>
        ))}

        <button
          onClick={openPreview}
          className={`flex-shrink-0 w-36 md:w-44 aspect-[3/4] cursor-pointer transform transition-transform hover:scale-[1.03] rounded-2xl shadow-xl bg-gradient-to-br ${CATEGORY_COLORS[PREVIEW_CARD.category]} flex items-center justify-center p-4 ring-2 ring-white/40`}
        >
          <div className="text-center">
            <p className="text-white font-medium text-base drop-shadow-lg mb-1">{PREVIEW_CARD.label}</p>
            <p className="text-white/75 text-xs">Tap to experience</p>
          </div>
        </button>

        {OTHER_CATEGORIES.slice(3).map(cat => (
          <div
            key={cat}
            className={`flex-shrink-0 w-20 md:w-24 aspect-[3/4] rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cat]} opacity-30 flex items-end justify-center p-2`}
          >
            <p className="text-white text-[10px] font-semibold text-center leading-tight drop-shadow">{CATEGORY_LABELS[cat]}</p>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ overscrollBehavior: 'contain' }}>
          <div className="flex-1 relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${PREVIEW_CARD.videoId}?autoplay=1&rel=0`}
              title={PREVIEW_CARD.label}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
              <h3 className="text-white font-bold text-lg drop-shadow">{PREVIEW_CARD.label}</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close video"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          <div className="bg-surface-card rounded-t-3xl flex flex-col" style={{ maxHeight: '55vh' }}>
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-center mb-3 flex-shrink-0">
                <div className="w-10 h-1 bg-border-strong rounded-full" />
              </div>

              {chatDone ? (
                <div className="bg-accent-light border border-border rounded-xl p-6 text-center">
                  <p className="text-2xl mb-1">✨</p>
                  <p className="text-text-primary font-bold text-xl mb-2">You felt it</p>
                  <p className="text-text-secondary text-sm mb-4">
                    Sign up to collect a new awe moment every day and keep your wonder journal.
                  </p>
                  <button
                    onClick={() => router.push('/signup')}
                    className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-hover mb-2"
                  >
                    Start Collecting →
                  </button>
                  <button onClick={() => setOpen(false)} className="text-text-muted text-sm">
                    Maybe later
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-primary-light text-text-primary rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-primary-light px-4 py-2 rounded-2xl rounded-bl-sm">
                          <span className="text-text-muted text-sm tracking-widest">···</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {!chatDone && (
                    <div className="flex gap-2 flex-shrink-0">
                      <input
                        name="reflection"
                        autoComplete="off"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type your reflection…"
                        className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!chatInput.trim() || chatLoading}
                        aria-label="Send message"
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
                      >
                        →
                      </button>
                    </div>
                  )}

                  {canComplete && !chatDone && (
                    <button
                      onClick={() => router.push('/signup')}
                      className="mt-2 w-full py-3 rounded-xl font-medium text-sm bg-primary text-white hover:bg-primary-hover flex-shrink-0"
                    >
                      Sign up to keep this card ✨
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
