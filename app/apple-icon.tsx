import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #102738, #07131D)',
          borderRadius: 48,
          position: 'relative',
          boxSizing: 'border-box',
          border: '3px solid rgba(118,255,193,0.22)',
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            display: 'flex',
            borderRadius: '50%',
            border: '14px solid #00E676',
            background: 'rgba(4,20,13,0.38)',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 10,
              width: 13,
              height: 26,
              borderRadius: 999,
              background: '#7AFFCE',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 37,
              bottom: 10,
              width: 13,
              height: 47,
              borderRadius: 999,
              background: '#0BFF86',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 56,
              bottom: 10,
              width: 13,
              height: 36,
              borderRadius: 999,
              background: '#28D9A0',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            width: 48,
            height: 16,
            display: 'flex',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #22FFA8, #00C88A)',
            transform: 'rotate(45deg)',
            right: 28,
            bottom: 30,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 28,
            right: 28,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#8BFFD5',
          }}
        />
      </div>
    ),
    size,
  );
}
