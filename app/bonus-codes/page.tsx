'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BONUS_CODES_STORAGE_KEY,
  BONUS_CODES_UPDATED_EVENT,
  BONUS_CODE_TONES,
  DEFAULT_BONUS_CODES_PAGE_CONFIG,
  readBonusCodesPageConfig,
  sortBonusCodeEntries,
  type BonusCodeEntry,
} from '@/lib/bonus-codes';

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-full px-3 py-2"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--t-text-5)' }}>
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
        {value}
      </div>
    </div>
  );
}

function BonusCodeCard({
  entry,
  copied,
  onCopy,
}: {
  entry: BonusCodeEntry;
  copied: boolean;
  onCopy: (entry: BonusCodeEntry) => void;
}) {
  const tone = BONUS_CODE_TONES[entry.toneId];

  return (
    <article
      className="panel-shell relative overflow-hidden rounded-[24px] p-5"
      style={{
        background: `linear-gradient(145deg, ${tone.backgroundFrom} 0%, ${tone.backgroundTo} 100%)`,
        borderColor: tone.borderColor,
        boxShadow: `0 20px 55px ${tone.glow}`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 'auto -40px -70px auto',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${tone.accentColor} 0%, transparent 70%)`,
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: tone.accentColor }}>
              {entry.bookmaker}
            </div>
            {entry.badge ? (
              <span
                className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ background: tone.chipBackground, color: tone.chipColor }}
              >
                {entry.badge}
              </span>
            ) : null}
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Bonus code
          </span>
        </div>

        <div>
          <h2 className="max-w-[22ch] text-[24px] font-black leading-[1.05] tracking-[-0.03em]" style={{ color: '#f8fbff' }}>
            {entry.offer}
          </h2>
          <p className="mt-3 max-w-[52ch] text-[13px] leading-6" style={{ color: 'rgba(242,246,255,0.78)' }}>
            {entry.description}
          </p>
        </div>

        <div
          className="rounded-[18px] p-3"
          style={{
            background: tone.codeBackground,
            border: `1px solid ${tone.codeBorder}`,
          }}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Code
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="min-w-0 flex-1 rounded-xl px-3 py-2 text-[18px] font-black tracking-[0.18em]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.14)',
                color: '#ffffff',
              }}
            >
              {entry.code}
            </div>
            <button
              type="button"
              onClick={() => onCopy(entry)}
              className="chrome-btn rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{
                background: copied ? 'rgba(0,230,118,0.16)' : 'rgba(255,255,255,0.06)',
                borderColor: copied ? 'rgba(0,230,118,0.28)' : 'rgba(255,255,255,0.12)',
                color: copied ? '#9effcf' : '#eef4ff',
              }}
            >
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 text-[11px] leading-5" style={{ color: 'rgba(242,246,255,0.58)' }}>
            {entry.terms || 'Add short terms text from the admin panel.'}
          </div>

          {entry.href ? (
            <a
              href={entry.href}
              className="inline-flex items-center rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
              style={{
                textDecoration: 'none',
                background: tone.buttonBackground,
                color: tone.buttonColor,
                boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
              }}
            >
              {entry.ctaLabel}
            </a>
          ) : (
            <span
              className="inline-flex items-center rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Add landing URL
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function BonusCodesPage() {
  const [config, setConfig] = useState(DEFAULT_BONUS_CODES_PAGE_CONFIG);
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setConfig(readBonusCodesPageConfig());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BONUS_CODES_STORAGE_KEY) {
        sync();
      }
    };

    sync();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(BONUS_CODES_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener(BONUS_CODES_UPDATED_EVENT, sync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!copiedEntryId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedEntryId(null);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedEntryId]);

  const activeEntries = useMemo(
    () => sortBonusCodeEntries(config.entries.filter((entry) => entry.isActive)),
    [config.entries],
  );
  const featuredEntries = useMemo(
    () => activeEntries.filter((entry) => entry.isFeatured),
    [activeEntries],
  );
  const standardEntries = useMemo(
    () => activeEntries.filter((entry) => !entry.isFeatured),
    [activeEntries],
  );

  async function handleCopy(entry: BonusCodeEntry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedEntryId(entry.id);
    } catch {
      setCopiedEntryId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 md:px-5 md:py-6">
      <section
        className="panel-shell relative overflow-hidden rounded-[28px] px-5 py-6 md:px-7 md:py-7"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(0,230,118,0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(245,158,11,0.14), transparent 32%), linear-gradient(145deg, rgba(10,18,34,0.96), rgba(15,26,47,0.92))',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -110,
            top: -90,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(59,130,246,0.2), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: '#9ef9cc' }}>
              {config.copy.eyebrow}
            </div>
            <h1 className="mt-3 max-w-[14ch] text-[34px] font-black leading-[0.95] tracking-[-0.04em] md:text-[46px]" style={{ color: '#f8fbff' }}>
              {config.copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 md:text-[15px]" style={{ color: 'rgba(231,238,248,0.76)' }}>
              {config.copy.subtitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill label="Active" value={`${activeEntries.length} live`} />
            <StatPill label="Featured" value={`${featuredEntries.length} pinned`} />
            <StatPill label="Workflow" value="Copy + claim" />
          </div>
        </div>
      </section>

      {!activeEntries.length ? (
        <section className="panel-shell rounded-[24px] px-5 py-8 text-center">
          <div className="mx-auto max-w-xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--t-text-5)' }}>
              No active offers
            </div>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.03em]" style={{ color: 'var(--t-text-1)' }}>
              Bonus codes page is ready for content
            </h2>
            <p className="mt-3 text-[13px] leading-6" style={{ color: 'var(--t-text-4)' }}>
              Open the admin panel and add or activate bonus code cards. As soon as you save them there, this page will reflect the updated lineup in the same browser profile.
            </p>
          </div>
        </section>
      ) : null}

      {featuredEntries.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#94f6c9' }}>
                {config.copy.featuredLabel}
              </div>
              <div className="mt-1 text-[13px]" style={{ color: 'var(--t-text-4)' }}>
                Put your strongest or most time-sensitive offers first.
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {featuredEntries.map((entry) => (
              <BonusCodeCard
                key={entry.id}
                entry={entry}
                copied={copiedEntryId === entry.id}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </section>
      ) : null}

      {standardEntries.length ? (
        <section className="space-y-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--t-text-5)' }}>
              {config.copy.allLabel}
            </div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--t-text-4)' }}>
              Keep evergreen codes, secondary campaigns, and bookmaker-specific promos here.
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {standardEntries.map((entry) => (
              <BonusCodeCard
                key={entry.id}
                entry={entry}
                copied={copiedEntryId === entry.id}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
