import { useId } from 'react';

type OddsDetectorLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  textColor?: string;
  accentColor?: string;
  muted?: boolean;
};

type OddsDetectorMarkProps = {
  size?: number;
  className?: string;
  muted?: boolean;
};

export function OddsDetectorMark({ size = 40, className, muted = false }: OddsDetectorMarkProps) {
  const glassId = useId();

  const streakColor = muted ? '#4b5563' : '#00e676';
  const ringColor = muted ? '#6b7280' : '#ffffff';
  const pulseColor = muted ? '#4b5563' : '#00e676';

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speed streaks — left side */}
      <rect x="2" y="15" width="9"  height="3.5" rx="1.75" fill={streakColor} opacity="0.75" />
      <rect x="1" y="21" width="12" height="3.5" rx="1.75" fill={streakColor} opacity="0.55" />
      <rect x="2" y="27" width="8"  height="3.5" rx="1.75" fill={streakColor} opacity="0.38" />

      {/* Magnifier ring */}
      <circle cx="31" cy="22" r="13" stroke={ringColor} strokeWidth="4" fill="none" />

      {/* EKG / heartbeat pulse inside ring */}
      <polyline
        points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
        stroke={pulseColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Handle */}
      <line x1="40" y1="31" x2="48" y2="40" stroke={ringColor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function OddsDetectorLogo({
  size = 40,
  className,
  showWordmark = true,
  wordmarkClassName,
  textColor = 'var(--t-text-1)',
  accentColor = 'var(--t-accent)',
  muted = false,
}: OddsDetectorLogoProps) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: size >= 32 ? 10 : 8 }}>
      <OddsDetectorMark size={size} muted={muted} />
      {showWordmark ? (
        <span className={wordmarkClassName} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
          <span
            style={{
              color: muted ? 'var(--t-text-5, #6B7280)' : textColor,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Odds
          </span>
          <span
            style={{
              color: muted ? 'var(--t-text-4, #8B94A7)' : accentColor,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Detector
          </span>
        </span>
      ) : null}
    </span>
  );
}
