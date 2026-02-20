import { ImageResponse } from 'next/og'
import { sql } from '@vercel/postgres'

export const alt = 'Awed Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const STAGE_COLORS = [
  { stroke: '#94a3b8', glow: '#cbd5e1' },  // Seed
  { stroke: '#4ade80', glow: '#86efac' },  // Sprout
  { stroke: '#fb7185', glow: '#fda4af' },  // Root
  { stroke: '#c084fc', glow: '#d8b4fe' },  // Branch
  { stroke: '#38bdf8', glow: '#7dd3fc' },  // Canopy
  { stroke: '#fbbf24', glow: '#fde68a' },  // Forest
  { stroke: '#818cf8', glow: '#a5b4fc' },  // Sky
]

function getStage(totalCards) {
  if (totalCards >= 300) return { name: 'Sky', colorIndex: 6 }
  if (totalCards >= 150) return { name: 'Forest', colorIndex: 5 }
  if (totalCards >= 75) return { name: 'Canopy', colorIndex: 4 }
  if (totalCards >= 30) return { name: 'Branch', colorIndex: 3 }
  if (totalCards >= 15) return { name: 'Root', colorIndex: 2 }
  if (totalCards >= 5) return { name: 'Sprout', colorIndex: 1 }
  return { name: 'Seed', colorIndex: 0 }
}

function getRadius(totalCards) {
  return Math.min(15 + Math.sqrt(totalCards) * 4.5, 85)
}

function generateRays(count, circleRadius) {
  const rays = []
  const gap = 6
  const rayLength = Math.min(9 + count * 0.8, 15)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360 - 90
    const rad = (angle * Math.PI) / 180
    const startR = circleRadius + gap
    const endR = circleRadius + gap + rayLength
    rays.push({
      x1: 100 + Math.cos(rad) * startR,
      y1: 100 + Math.sin(rad) * startR,
      x2: 100 + Math.cos(rad) * endR,
      y2: 100 + Math.sin(rad) * endR,
    })
  }
  return rays
}

export default async function Image({ params }) {
  const { userId } = await params

  let name = 'Anonymous'
  let totalCards = 0
  let totalWalks = 0

  try {
    const userResult = await sql`
      SELECT id, name FROM users WHERE id = ${parseInt(userId, 10)}
    `
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      name = user.name || 'Anonymous'

      const statsResult = await sql`
        SELECT COUNT(*) as total_cards FROM user_cards WHERE user_id = ${user.id}
      `
      totalCards = parseInt(statsResult.rows[0].total_cards)

      try {
        const walksResult = await sql`
          SELECT COUNT(*) as total_walks FROM explore_keeps WHERE user_id = ${user.id}
        `
        totalWalks = parseInt(walksResult.rows[0].total_walks)
      } catch (e) { /* table may not exist */ }
    }
  } catch (e) {
    // fallback to defaults
  }

  const stage = getStage(totalCards)
  const color = STAGE_COLORS[stage.colorIndex]
  const radius = getRadius(totalCards)
  const rays = generateRays(totalWalks, radius)
  const initial = name.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color.glow}22 0%, transparent 70%)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Awed branding */}
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginBottom: '24px' }}>
          AWED
        </span>

        {/* Awera circle SVG */}
        <svg width="220" height="220" viewBox="0 0 200 200">
          {/* Glow halo */}
          <circle cx="100" cy="100" r={radius + 14} fill={color.glow} opacity="0.15" />

          {/* Main ring */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke={color.stroke} strokeWidth="2.5" opacity="0.9" />

          {/* Walk rays */}
          {rays.map((ray, i) => (
            <line
              key={i}
              x1={ray.x1}
              y1={ray.y1}
              x2={ray.x2}
              y2={ray.y2}
              stroke={color.stroke}
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.85"
            />
          ))}

          {/* Meditation silhouette */}
          <circle cx="100" cy="78" r="8" fill="white" opacity="0.3" />
          <ellipse cx="100" cy="102" rx="12" ry="14" fill="white" opacity="0.3" />
          <ellipse cx="100" cy="116" rx="18" ry="5" fill="white" opacity="0.3" />
        </svg>

        {/* Stage name */}
        <span style={{ fontSize: '16px', color: color.stroke, fontWeight: 600, marginTop: '8px' }}>
          {stage.name}
        </span>

        {/* User name */}
        <span style={{ fontSize: '42px', fontWeight: 800, color: 'white', marginTop: '16px' }}>
          {name}
        </span>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{totalCards}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Moments</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{totalWalks}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Walks</span>
          </div>
        </div>

        {/* URL */}
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)', marginTop: '20px' }}>
          awed.life
        </span>
      </div>
    ),
    { ...size }
  )
}
