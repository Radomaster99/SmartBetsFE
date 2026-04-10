'use client';

import type { CSSProperties } from 'react';
import {
  DEFAULT_HERO_BANNER_HEIGHT_PX,
  buildHeroBannerImageStyle,
  normalizeHeroBannerHeight,
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
  heightPx?: number;
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
  heightPx,
}: Props) {
  const appearance = resolveHeroBannerAppearance(banner);
  const resolvedHeightPx = normalizeHeroBannerHeight(heightPx, DEFAULT_HERO_BANNER_HEIGHT_PX);
  const isCompact = resolvedHeightPx <= 100;
  const isUltraCompact = resolvedHeightPx <= 92;
  const effectiveFontScale = appearance.fontScale * (isUltraCompact ? 0.82 : isCompact ? 0.9 : 1);
  const isLeftAligned = appearance.contentAlign === 'left';
  const titleFontSize = `clamp(${10.5 * effectiveFontScale}px, ${1.0 * effectiveFontScale}vw, ${13 * effectiveFontScale}px)`;
  const offerFontSize = `clamp(${7.2 * effectiveFontScale}px, ${0.68 * effectiveFontScale}vw, ${9.2 * effectiveFontScale}px)`;
  const eyebrowFontSize = `${Math.max(6, 6.8 * effectiveFontScale).toFixed(2)}px`;
  const ctaFontSize = `clamp(${7.4 * effectiveFontScale}px, ${0.68 * effectiveFontScale}vw, ${8.8 * effectiveFontScale}px)`;
  const rootStyle: CSSProperties = {
    textDecoration: 'none',
    background: appearance.background,
    border: `1px solid ${appearance.borderColor}`,
    textAlign: appearance.contentAlign,
    fontFamily: appearance.fontFamily,
    overflow: 'hidden',
    height: `${resolvedHeightPx}px`,
  };
  const content = (
    <>
      <div className={cx('flex items-start justify-between', isCompact ? 'gap-0.5' : 'gap-1')}>
        <div
          className="text-left font-bold uppercase tracking-[0.14em]"
          style={{ color: appearance.eyebrowColor, fontSize: eyebrowFontSize }}
        >
          {isUltraCompact ? '' : banner.eyebrow}
        </div>
        <svg
          viewBox="0 0 24 24"
          width={isCompact ? '9' : '10'}
          height={isCompact ? '9' : '10'}
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
          'flex min-h-0 flex-1 flex-col justify-center',
          isLeftAligned ? 'items-start' : 'items-center',
        )}
      >
        <div
          className={cx(isCompact ? 'mt-0 font-black tracking-[-0.02em]' : 'mt-0.5 font-black tracking-[-0.02em]')}
          style={{ color: appearance.titleColor, fontSize: titleFontSize, lineHeight: 1.1 }}
        >
          {banner.bookmaker}
        </div>

        <div
          className={cx(
            isCompact ? 'mt-0.5 leading-[1.25]' : 'mt-1 leading-3 md:min-h-[28px]',
            isLeftAligned ? 'max-w-[170px]' : 'mx-auto max-w-[180px]',
          )}
          style={{
            color: appearance.offerColor,
            fontSize: offerFontSize,
            lineHeight: isCompact ? 1.2 : 1.35,
            fontWeight: 600,
            minHeight: isCompact ? undefined : 24,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: isUltraCompact ? 1 : 2,
            overflow: 'hidden',
          }}
        >
          {banner.offer}
        </div>
      </div>

      <div
        className={cx(
          isCompact
            ? 'mt-0.5 rounded-full px-2 py-0.5 font-black uppercase tracking-[0.08em]'
            : 'mt-1 rounded-full px-2 py-1 font-black uppercase tracking-[0.08em]',
          clickable ? 'transition-transform duration-150 group-hover:translate-y-[-1px]' : undefined,
        )}
        style={{
          background: appearance.ctaBackground,
          color: appearance.ctaColor,
          fontSize: ctaFontSize,
          alignSelf: isLeftAligned ? 'flex-start' : 'center',
          minWidth: isLeftAligned ? 'auto' : isCompact ? '72px' : '88px',
          maxWidth: '100%',
          flexShrink: 0,
        }}
      >
        {banner.cta}
      </div>
    </>
  );

  const wrapperClassName = cx(
    isCompact
      ? 'relative flex flex-col rounded-[8px] px-2 py-1.5 md:px-2.5'
      : 'relative flex flex-col rounded-[8px] px-2 py-2 md:px-3',
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
