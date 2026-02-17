'use client'

import { useEffect, useState } from 'react'

function getRadius(totalCards) {
  return Math.min(15 + Math.sqrt(totalCards) * 4.5, 85)
}

// Stage colors drawn from the 8 category palettes
const STAGE_COLORS = [
  { stroke: '#94a3b8', glow: '#cbd5e1' },  // Seed      — slate    (life & death)
  { stroke: '#4ade80', glow: '#86efac' },  // Sprout    — green    (nature)
  { stroke: '#fb7185', glow: '#fda4af' },  // Root      — rose     (moral beauty)
  { stroke: '#c084fc', glow: '#d8b4fe' },  // Branch    — purple   (music)
  { stroke: '#38bdf8', glow: '#7dd3fc' },  // Canopy    — cyan     (visual design)
  { stroke: '#fbbf24', glow: '#fde68a' },  // Forest    — amber    (spirituality)
  { stroke: '#818cf8', glow: '#a5b4fc' },  // Sky       — indigo   (epiphany)
]

function getStage(totalCards) {
  if (totalCards >= 300) return { name: 'Sky', description: 'You live in open awe', colorIndex: 6 }
  if (totalCards >= 150) return { name: 'Forest', description: 'Wonder fills your days', colorIndex: 5 }
  if (totalCards >= 75) return { name: 'Canopy', description: 'Awe is with you', colorIndex: 4 }
  if (totalCards >= 30) return { name: 'Branch', description: "You're deepening", colorIndex: 3 }
  if (totalCards >= 15) return { name: 'Root', description: 'Roots are forming', colorIndex: 2 }
  if (totalCards >= 5) return { name: 'Sprout', description: 'A gentle awareness stirs', colorIndex: 1 }
  return { name: 'Seed', description: 'Your practice begins', colorIndex: 0 }
}

export default function AweraCircle({ totalCards = 0, size = 'lg' }) {
  const targetRadius = getRadius(totalCards)
  const [radius, setRadius] = useState(14) // start small for mount animation
  const stage = getStage(totalCards)
  const color = STAGE_COLORS[stage.colorIndex]

  const svgSize = size === 'lg' ? 180 : 120
  // Scale the viewBox coordinates to match svgSize
  const scale = svgSize / 200

  useEffect(() => {
    const timer = setTimeout(() => setRadius(targetRadius), 80)
    return () => clearTimeout(timer)
  }, [targetRadius])

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width={svgSize}
        height={svgSize}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="awera-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color.glow} stopOpacity="0.4" />
            <stop offset="60%" stopColor={color.stroke} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color.stroke} stopOpacity="0" />
          </radialGradient>
          <filter id="awera-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes awera-breathe {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50%       { transform: scale(1.06); opacity: 1; }
            }
            .awera-rings {
              transform-box: fill-box;
              transform-origin: center;
              animation: awera-breathe 5s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Breathing rings wrapper */}
        <g className="awera-rings">
          {/* Glow halo */}
          <circle
            cx="100"
            cy="100"
            r={radius + 14}
            fill="url(#awera-glow)"
            style={{ transition: 'r 1.2s ease-out' }}
          />

          {/* Main glowing ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="1.5"
            filter="url(#awera-filter)"
            style={{ transition: 'r 1.2s ease-out, stroke 0.8s ease-in-out' }}
          />
        </g>

        {/* Lotus/meditation silhouette — fixed size, always centered */}
        <g transform="translate(100, 104)" fill="#1e293b" opacity="0.6">
          {/* Head */}
          <circle cx="0" cy="-26" r="8" />
          {/* Body / torso cone */}
          <path d="M-7,-18 C-11,-8 -13,2 -15,10 L15,10 C13,2 11,-8 7,-18 Z" />
          {/* Left knee */}
          <ellipse cx="-16" cy="12" rx="8" ry="4" transform="rotate(-20,-16,12)" />
          {/* Right knee */}
          <ellipse cx="16" cy="12" rx="8" ry="4" transform="rotate(20,16,12)" />
          {/* Base / feet */}
          <ellipse cx="0" cy="16" rx="18" ry="5" />
        </g>
      </svg>

      <div className="text-center mt-1">
        <p className={`font-semibold text-gray-700 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          {stage.name}
        </p>
        <p className={`text-gray-400 mt-0.5 ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
          {stage.description}
        </p>
      </div>
    </div>
  )
}
