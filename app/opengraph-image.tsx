import { ImageResponse } from 'next/og';

export const alt = 'OddsDetector — Football Odds Comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07101a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Green accent bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#00e676',
          }}
        />

        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#f4f8ff',
            display: 'flex',
            gap: 0,
          }}
        >
          <span>Odds</span>
          <span style={{ color: '#00e676' }}>Detector</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.02em',
          }}
        >
          Football Odds Comparison
        </div>

        {/* Domain */}
        <div
          style={{
            marginTop: 40,
            fontSize: 18,
            fontWeight: 600,
            color: '#00e676',
            opacity: 0.7,
            letterSpacing: '0.08em',
          }}
        >
          oddsdetector.com
        </div>
      </div>
    ),
    { ...size },
  );
}
