import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Coplio — Logiciel de gestion syndic'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Coplio
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          color: 'white',
          fontSize: '64px',
          fontWeight: '800',
          lineHeight: 1.1,
          margin: '0 0 24px 0',
          maxWidth: '800px',
        }}>
          Gérez vos copropriétés simplement
        </h1>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: '28px',
          fontWeight: '400',
          margin: '0 0 56px 0',
          maxWidth: '700px',
          lineHeight: 1.4,
        }}>
          Le logiciel tout-en-un pour les syndics professionnels
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Charges & appels de fonds', 'AG & convocations', 'Portail copropriétaires'].map((tag) => (
            <div key={tag} style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '100px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '18px',
              fontWeight: '500',
            }}>
              {tag}
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '80px',
          background: '#E6A93A',
          borderRadius: '12px',
          padding: '12px 24px',
          color: 'white',
          fontSize: '20px',
          fontWeight: '700',
        }}>
          14 jours gratuits
        </div>
      </div>
    ),
    { ...size }
  )
}
