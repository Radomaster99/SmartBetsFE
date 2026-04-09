'use client';

import type { CSSProperties } from 'react';
import {
  buildHeroBannerImageStyle,
  resolveHeroBannerAppearance,
  type HeroBannerConfig,
} from '@/lib/hero-banners';

type Props = {
  banner: HeroBannerConfig;
  href?: string | null;
  clickable?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function HeroBannerCard({
  banner,
  href,
  clickable = false,
  className,
  title,
  ariaLabel,
}: Props) {
  const appearance = resolveHeroBannerAppearance(banner);
  const isLeftAligned = appearance.contentAlign === 'left';
  const titleFontSize = `clamp(${11 * appearance.fontScale}px, ${1.05 * appearance.fontScale}vw, ${13 * appearance.fontScale}px)`;
  const offerFontSize = `clamp(${8 * appearance.fontScale}px, ${0.72 * appearance.fontScale}vw, ${9.5 * appearance.fontScale}px)`;
  const eyebrowFontSize = `${Math.max(6.5, 7 * appearance.fontScale).toFixed(2)}px`;
  const ctaFontSize = `clamp(${8 * appearance.fontScale}px, ${0.72 * appearance.fontScale}vw, ${9 * appearance.fontScale}px)`;
  const rootStyle: CSSProperties = {
    textDecoration: 'none',
    background: appearance.background,
    border: `1px solid ${appearance.borderColor}`,
    textAlign: appearance.contentAlign,
    fontFamily: appearance.fontFamily,
    overflow: 'hidden',
  };
  const content = (
    <>
      <div className="flex items-start justify-between gap-1">
        <div
          className="text-left font-bold uppercase tracking-[0.14em]"
          style={{ color: appearance.eyebrowColor, fontSize: eyebrowFontSize }}
        >
          {banner.eyebrow}
        </div>
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          aria-hidden="true"
          fill="none"
          stroke={appearance.titleColor}
          strokeWidth="2"
          className={clickable ? 'transition-transform duration-150 group-hover:-translate-y-0.5' : undefined}
          style={{ opacity: 0.88 }}
        >
          <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div
        className={cx(
          'flex flex-1 flex-col justify-center',
          isLeftAligned ? 'items-start' : 'items-center',
        )}
      >
        <div
          className="mt-0.5 font-black tracking-[-0.02em]"
          style={{ color: appearance.titleColor, fontSize: titleFontSize, lineHeight: 1.1 }}
        >
          {banner.bookmaker}
        </div>

        <div
          className={cx(
            'mt-1 min-h-[24px] leading-3 md:min-h-[28px]',
            isLeftAligned ? 'max-w-[170px]' : 'mx-auto max-w-[180px]',
          )}
          style={{
            color: appearance.offerColor,
            fontSize: offerFontSize,
            lineHeight: 1.35,
            fontWeight: 600,
          }}
        >
          {banner.offer}
        </div>
      </div>

      <div
        className={cx(
          'mt-1 rounded-full px-2 py-1 font-black uppercase tracking-[0.08em]',
          clickable ? 'transition-transform duration-150 group-hover:translate-y-[-1px]' : undefined,
        )}
        style={{
          background: appearance.ctaBackground,
          color: appearance.ctaColor,
          fontSize: ctaFontSize,
          alignSelf: isLeftAligned ? 'flex-start' : 'center',
          minWidth: isLeftAligned ? 'auto' : '88px',
        }}
      >
        {banner.cta}
      </div>
    </>
  );

  const wrapperClassName = cx(
    'relative flex h-[104px] flex-col rounded-[8px] px-2 py-2 md:h-[112px] md:px-3',
    clickable ? 'group' : '',
    className,
  );

  const contentBlock = (
    <>
      {appearance.backgroundImageSrc ? (
        <img
          src={appearance.backgroundImageSrc}
          alt=""
          aria-hidden="true"
          style={{
            ...buildHeroBannerImageStyle(banner),
            opacity: appearance.backgroundImageOpacity,
          }}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,13,0.18),rgba(6,8,13,0.08))]" />

      <div className="relative z-10 flex h-full flex-col">
        {content}
      </div>
    </>
  );

  if (clickable && href) {
    return (
      <a href={href} className={wrapperClassName} style={rootStyle} title={title} aria-label={ariaLabel}>
        {contentBlock}
      </a>
    );
  }

  return (
    <div className={wrapperClassName} style={rootStyle} title={title} aria-label={ariaLabel}>
      {contentBlock}
    </div>
  );
}
