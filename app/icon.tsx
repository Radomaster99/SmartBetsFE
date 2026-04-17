import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64,
};

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
          background: 'linear-gradient(145deg, #102738, #07131D)',
          borderRadius: 20,
          position: 'relative',
          boxSizing: 'border-box',
          border: '1px solid rgba(118,255,193,0.25)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            display: 'flex',
            borderRadius: '50%',
            border: '6px solid #00E676',
            background: 'rgba(4,20,13,0.38)',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 6,
              bottom: 4,
              width: 5,
              height: 10,
              borderRadius: 999,
              background: '#7AFFCE',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 13,
              bottom: 4,
              width: 5,
              height: 18,
              borderRadius: 999,
              background: '#0BFF86',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 4,
              width: 5,
              height: 14,
              borderRadius: 999,
              background: '#28D9A0',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            width: 18,
            height: 7,
            display: 'flex',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #22FFA8, #00C88A)',
            transform: 'rotate(45deg)',
            right: 12,
            bottom: 12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#8BFFD5',
          }}
        />
      </div>
    ),
    size,
  );
}
