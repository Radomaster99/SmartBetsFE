import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #102738, #07131d)',
          borderRadius: 18,
          border: '1.5px solid rgba(0,230,118,0.35)',
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed streaks */}
          <rect x="2"  y="15" width="9"  height="3.5" rx="1.75" fill="#00e676" opacity={0.75} />
          <rect x="1"  y="21" width="12" height="3.5" rx="1.75" fill="#00e676" opacity={0.55} />
          <rect x="2"  y="27" width="8"  height="3.5" rx="1.75" fill="#00e676" opacity={0.38} />
          {/* Ring */}
          <circle cx="31" cy="22" r="13" stroke="white" strokeWidth="4" fill="none" />
          {/* EKG */}
          <polyline
            points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
            stroke="#00e676"
            strokeWidth="2.2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Handle */}
          <line x1="40" y1="31" x2="48" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
