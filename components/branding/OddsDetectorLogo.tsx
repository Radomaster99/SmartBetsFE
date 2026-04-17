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
};

export function OddsDetectorMark({ size = 40, className }: OddsDetectorMarkProps) {
  const gradientId = useId();
  const ringId = useId();
  const handleId = useId();

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#102738" />
          <stop offset="1" stopColor="#07131D" />
        </linearGradient>
        <linearGradient id={ringId} x1="12" y1="10" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5FFFB7" />
          <stop offset="0.55" stopColor="#00E676" />
          <stop offset="1" stopColor="#00BFA5" />
        </linearGradient>
        <linearGradient id={handleId} x1="27" y1="27" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22FFA8" />
          <stop offset="1" stopColor="#00C88A" />
        </linearGradient>
      </defs>

      <rect x="4" y="4" width="40" height="40" rx="14" fill={`url(#${gradientId})`} />
      <rect x="4.5" y="4.5" width="39" height="39" rx="13.5" stroke="rgba(118,255,193,0.18)" />
      <circle cx="22" cy="20.5" r="10" fill="rgba(4,20,13,0.38)" stroke={`url(#${ringId})`} strokeWidth="3.5" />
      <path d="M28.8 28.8L35.4 35.4" stroke={`url(#${handleId})`} strokeWidth="4.6" strokeLinecap="round" />
      <rect x="16.2" y="20.2" width="3.2" height="5.8" rx="1.4" fill="#79FFD0" fillOpacity="0.9" />
      <rect x="21.2" y="15.5" width="3.2" height="10.5" rx="1.4" fill="#0BFF86" />
      <rect x="26.2" y="17.7" width="3.2" height="8.3" rx="1.4" fill="#28D9A0" fillOpacity="0.9" />
      <circle cx="31.5" cy="12.2" r="2.1" fill="#8BFFD5" fillOpacity="0.82" />
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
      <OddsDetectorMark size={size} />
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
