'use client'

import { useEffect, useState } from 'react'

const milestones = [
  { count: 5, label: 'First Pause', emoji: '🌱' },
  { count: 15, label: 'Gentle Noticer', emoji: '🌿' },
  { count: 30, label: 'Steady Witness', emoji: '🌾' },
  { count: 75, label: 'Open Observer', emoji: '🌤' },
  { count: 150, label: 'Deepening Presence', emoji: '🌅' },
  { count: 300, label: 'Living in Wonder', emoji: '🌌' },
  { count: 500, label: 'Rooted in Awe', emoji: '🌊' },
]

export default function AchievementToast({ newCardCount, onDismiss }) {
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState([])

  // Check if user just hit a milestone
  const milestone = milestones.find(m => m.count === newCardCount)

  useEffect(() => {
    if (milestone) {
      setShow(true)
      
      // Generate confetti
      const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5,
        color: ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)]
      }))
      setConfetti(confettiPieces)

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onDismiss, 300) // Wait for animation to finish
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [milestone, onDismiss])

  if (!milestone) return null

  return (
    <>
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="absolute top-0 w-3 h-3 rounded-full animate-fall"
            style={{
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Toast */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[101] transition-all duration-300 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border-2 border-yellow-300">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-bounce">{milestone.emoji}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Achievement Unlocked!
            </h3>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {milestone.label}
            </p>
            <p className="text-gray-600 text-sm">
              {newCardCount} cards collected
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </>
  )
}