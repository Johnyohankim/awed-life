'use client'

import { useEffect, useState } from 'react'

function getRadius(totalCards) {
  return Math.min(15 + Math.sqrt(totalCards) * 4.5, 85)
}

// Stage colors — warm organic tones matching the new palette
const STAGE_COLORS = [
  { stroke: '#8A8278', glow: '#B8B0A8' },  // Seed      — warm stone
  { stroke: '#6B9B6B', glow: '#A8C5A0' },  // Sprout    — sage
  { stroke: '#C97B84', glow: '#E8B4B8' },  // Root      — dusty rose
  { stroke: '#957BA8', glow: '#C4A8D4' },  // Branch    — lavender
  { stroke: '#6B8FA8', glow: '#A0B8C8' },  // Canopy    — dusty blue
  { stroke: '#B8A86B', glow: '#D4C8A0' },  // Forest    — golden wheat
  { stroke: '#6B78A8', glow: '#A0A8C8' },  // Sky       — twilight blue
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

// Generate evenly-spaced rays around the circle
function generateRays(count, circleRadius) {
  const rays = []
  const gap = 6 // gap between circle edge and ray start
  // Ray length grows slightly with more walks, from 9 to 15
  const baseLength = 9
  const maxLength = 15
  const rayLength = Math.min(baseLength + count * 0.8, maxLength)
  const rayWidth = 5

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360 - 90 // start from top
    const rad = (angle * Math.PI) / 180
    const startR = circleRadius + gap
    const endR = circleRadius + gap + rayLength

    rays.push({
      x1: 100 + Math.cos(rad) * startR,
      y1: 100 + Math.sin(rad) * startR,
      x2: 100 + Math.cos(rad) * endR,
      y2: 100 + Math.sin(rad) * endR,
      width: rayWidth,
      // Round cap lines for friendly look
      roundX: 100 + Math.cos(rad) * (endR + 1),
      roundY: 100 + Math.sin(rad) * (endR + 1),
    })
  }
  return rays
}

export default function AweraCircle({ totalCards = 0, totalWalks = 0, size = 'lg' }) {
  const targetRadius = getRadius(totalCards)
  const [radius, setRadius] = useState(14) // start small for mount animation
  const [showRays, setShowRays] = useState(false)
  const stage = getStage(totalCards)
  const color = STAGE_COLORS[stage.colorIndex]

  const svgSize = size === 'lg' ? 180 : 120

  useEffect(() => {
    const timer = setTimeout(() => setRadius(targetRadius), 80)
    const rayTimer = setTimeout(() => setShowRays(true), 600)
    return () => { clearTimeout(timer); clearTimeout(rayTimer) }
  }, [targetRadius])

  const rays = generateRays(totalWalks, radius)

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
          <filter id="ray-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
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
            @keyframes ray-appear {
              0% { opacity: 0; transform: scaleY(0); }
              100% { opacity: 1; transform: scaleY(1); }
            }
            @media (prefers-reduced-motion: reduce) {
              .awera-rings {
                animation: none;
              }
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

        {/* Walk rays — on top of the glow halo */}
        {totalWalks > 0 && rays.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={color.stroke}
            strokeWidth={ray.width}
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}

        {/* Lotus/meditation silhouette — fixed size, always centered */}
        <g transform="translate(100, 104)" fill="#292524" opacity="0.5">
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
        <p className={`font-semibold text-text-primary ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          {stage.name}
        </p>
        <p className={`text-text-muted mt-0.5 ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
          {stage.description}
        </p>
      </div>
    </div>
  )
}
