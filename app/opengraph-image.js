import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Awed - Daily Awe Moments'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
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
        {/* Subtle glow circle */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Category cards row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          {[
            { label: 'Nature', color: '#059669' },
            { label: 'Music', color: '#7c3aed' },
            { label: 'Moral Beauty', color: '#e11d48', active: true },
            { label: 'Epiphany', color: '#4f46e5' },
            { label: 'Life & Death', color: '#475569' },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                width: card.active ? '90px' : '60px',
                height: card.active ? '120px' : '80px',
                borderRadius: '12px',
                background: card.color,
                opacity: card.active ? 1 : 0.35,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '8px 4px',
                boxShadow: card.active ? '0 0 24px rgba(225,29,72,0.4)' : 'none',
                border: card.active ? '2px solid rgba(255,255,255,0.5)' : 'none',
              }}
            >
              <span style={{ color: 'white', fontSize: card.active ? '9px' : '7px', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '72px', fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>
            Awed
          </span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.75)', margin: 0, textAlign: 'center' }}>
          A daily ritual of wonder
        </p>

        {/* Sub-tagline */}
        <p style={{ fontSize: '20px', color: 'rgba(129,140,248,0.9)', margin: '12px 0 0', textAlign: 'center' }}>
          One card · One moment · One reflection
        </p>

        {/* URL */}
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', marginTop: '32px' }}>
          awed.life
        </p>
      </div>
    ),
    { ...size }
  )
}
