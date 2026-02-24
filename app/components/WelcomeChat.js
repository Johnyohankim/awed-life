'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const NEWCOMER_FLOW = [
  {
    guide: "Hi there. Welcome to Awed \u2014 a place to slow down and feel wonder, just for a moment each day.",
    options: [
      { label: 'That sounds nice' },
      { label: 'I could use that' },
    ]
  },
  {
    guide: "Every day, you\u2019ll find 8 cards here \u2014 each one holds a short moment of awe. Could be nature, music, human kindness, or something unexpected.",
    options: [
      { label: 'What kind of moments?' },
      { label: 'OK, I\u2019m curious' },
    ]
  },
  {
    guide: "When one moves you, you write a few words about how it made you feel. That\u2019s your reflection \u2014 it stays private, just for you.",
    options: [
      { label: 'Like a tiny journal?' },
      { label: 'I like that' },
    ]
  },
  {
    guide: "There\u2019s also something called an Awe Walk \u2014 a small real-world activity to bring wonder into your day. Like watching a sunrise, visiting a gallery, or sitting in silence.",
    options: [
      { label: 'I\u2019d try that' },
      { label: 'Interesting' },
    ]
  },
  {
    guide: "So you have two ways to feel awe: watch a moment here, or go walk one out there. Ready to start?",
    options: [
      { label: 'Show me today\u2019s moments', route: null },
      { label: 'Take me to a walk', route: '/explore' },
    ]
  },
]

const RETURNING_GREETINGS = [
  (name) => `Welcome back${name ? `, ${name}` : ''}. What are you in the mood for?`,
  (name) => `Good to see you${name ? `, ${name}` : ''}. How would you like to feel awe today?`,
  (name) => `${name ? `${name}, a` : 'A'}nother day, another chance to feel awe. What calls to you?`,
  (name) => `${name ? `Hi ${name}. ` : ''}Take a breath. What would you like to do today?`,
  (name) => `A new day awaits${name ? `, ${name}` : ''}. How would you like to begin?`,
]

function getWelcomeMode() {
  try {
    let welcomeCompleted = localStorage.getItem('awed_welcome_completed') === 'true'
    const lastWelcomeDate = localStorage.getItem('awed_welcome_last_date')
    const today = new Date().toLocaleDateString('en-CA')

    // Migrate old onboarding flag
    if (!welcomeCompleted && localStorage.getItem('hasSeenOnboarding') === 'true') {
      localStorage.setItem('awed_welcome_completed', 'true')
      welcomeCompleted = true
    }

    if (!welcomeCompleted) return 'newcomer'
    if (lastWelcomeDate !== today) return 'returning'
    return null
  } catch {
    return 'newcomer' // localStorage unavailable, show newcomer as fallback
  }
}

function markWelcomeComplete() {
  try {
    localStorage.setItem('awed_welcome_completed', 'true')
    localStorage.setItem('awed_welcome_last_date', new Date().toLocaleDateString('en-CA'))
  } catch { /* silent */ }
}

export default function WelcomeChat({ userName, onComplete }) {
  const router = useRouter()
  const [mode] = useState(() => getWelcomeMode())
  const [step, setStep] = useState(0)
  const [messages, setMessages] = useState([])
  const [showTyping, setShowTyping] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [fading, setFading] = useState(false)
  const chatEndRef = useRef(null)
  const prefersReducedMotion = useRef(false)
  const hasStarted = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // If no welcome needed, complete immediately
  useEffect(() => {
    if (mode === null) {
      onComplete()
    }
  }, [mode, onComplete])

  // Show first guide message on mount (guard against Strict Mode double-fire)
  useEffect(() => {
    if (mode === null || hasStarted.current) return
    hasStarted.current = true
    showGuideMessage(0)
  }, [mode])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion.current ? 'auto' : 'smooth' })
  }, [messages, showTyping])

  // Handle back button
  useEffect(() => {
    if (mode === null) return
    window.history.pushState({ welcomeChat: true }, '')
    const handlePopState = () => handleDismiss(null)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [mode])

  const getFlow = () => {
    if (mode === 'newcomer') return NEWCOMER_FLOW
    // Returning: single step with rotating greeting + two choices
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const greeting = RETURNING_GREETINGS[dayOfYear % RETURNING_GREETINGS.length](userName)
    return [{
      guide: greeting,
      options: [
        { label: 'Feel the awe', route: null },
        { label: 'Walk the awe', route: '/explore' },
      ]
    }]
  }

  const flow = getFlow()

  const showGuideMessage = (stepIndex) => {
    const delay = prefersReducedMotion.current ? 0 : 400
    setShowButtons(false)
    setShowTyping(true)

    setTimeout(() => {
      setShowTyping(false)
      setMessages(prev => [...prev, { role: 'guide', content: flow[stepIndex].guide }])
      // Show buttons after message appears
      setTimeout(() => setShowButtons(true), prefersReducedMotion.current ? 0 : 200)
    }, delay)
  }

  const handleOptionSelect = (option) => {
    // Add user bubble
    setMessages(prev => [...prev, { role: 'user', content: option.label }])
    setShowButtons(false)

    const nextStep = step + 1
    if (nextStep < flow.length) {
      setStep(nextStep)
      setTimeout(() => showGuideMessage(nextStep), prefersReducedMotion.current ? 0 : 300)
    } else {
      // Done — navigate if route specified, otherwise dismiss to cards
      handleDismiss(option.route)
    }
  }

  const handleDismiss = (route) => {
    if (fading) return
    setFading(true)
    markWelcomeComplete()
    const delay = prefersReducedMotion.current ? 0 : 300
    setTimeout(() => {
      if (route) {
        router.push(route)
      }
      onComplete()
    }, delay)
  }

  if (mode === null) return null

  const currentOptions = showButtons && step < flow.length ? flow[step].options : []

  return (
    <div
      className={`fixed inset-0 bg-surface z-50 flex flex-col transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Top branding */}
      <div className="pt-16 pb-4 px-6 text-center flex-shrink-0">
        <h1 className="font-bold text-3xl text-text-primary">Awed</h1>
        {mode === 'newcomer' && (
          <p className="text-text-muted text-sm mt-1">A daily practice of wonder</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-4 overflow-y-auto min-h-0">
        <div className="space-y-3 max-w-md mx-auto w-full">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={prefersReducedMotion.current ? {} : {
                animation: 'welcomeFadeIn 0.3s ease-out',
              }}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-primary-light text-text-primary rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {showTyping && (
            <div className="flex justify-start" style={prefersReducedMotion.current ? {} : { animation: 'welcomeFadeIn 0.3s ease-out' }}>
              <div className="bg-primary-light px-4 py-3 rounded-2xl rounded-bl-sm">
                <span className="text-text-muted text-sm tracking-widest">...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom action area */}
      <div className="px-6 pb-8 flex-shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
          {currentOptions.map((option, i) => (
            <button
              key={i}
              onClick={() => handleOptionSelect(option)}
              className="w-full py-3 px-6 bg-surface-card border-2 border-border text-text-primary rounded-xl font-medium text-sm hover:border-primary hover:bg-primary-light transition-[border-color,background-color] active:scale-[0.98]"
              style={prefersReducedMotion.current ? {} : {
                animation: 'welcomeFadeIn 0.2s ease-out',
                animationFillMode: 'both',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {mode === 'newcomer' && step < flow.length - 1 && showButtons && (
          <button
            onClick={handleDismiss}
            className="w-full mt-3 text-sm text-text-muted hover:text-text-secondary text-center"
          >
            Skip
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes welcomeFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
