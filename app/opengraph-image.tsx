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
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#00e676', display: 'flex' }} />

        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: '50%',
            width: 700,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,0.13) 0%, transparent 70%)',
            transform: 'translateX(-50%)',
            display: 'flex',
          }}
        />

        {/* Mark */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2"  y="15" width="9"  height="3.5" rx="1.75" fill="#00e676" opacity={0.75} />
          <rect x="1"  y="21" width="12" height="3.5" rx="1.75" fill="#00e676" opacity={0.55} />
          <rect x="2"  y="27" width="8"  height="3.5" rx="1.75" fill="#00e676" opacity={0.38} />
          <circle cx="31" cy="22" r="13" stroke="white" strokeWidth="4" fill="none" />
          <polyline
            points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
            stroke="#00e676"
            strokeWidth="2.2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line x1="40" y1="31" x2="48" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>

        {/* Wordmark */}
        <div
          style={{
            marginTop: 20,
            fontSize: 80,
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
            marginTop: 16,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: '#00e676',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Compare. Detect. Win.
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.38)',
            letterSpacing: '0.02em',
            display: 'flex',
          }}
        >
          Football Odds Comparison
        </div>
      </div>
    ),
    { ...size },
  );
}
