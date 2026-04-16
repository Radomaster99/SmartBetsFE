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
  type BonusCodeToneId,
} from '@/lib/bonus-codes';

// ── Tone helpers ──────────────────────────────────────────────────────────────

const CARD_TOP_GRADIENTS: Record<BonusCodeToneId, { from: string; to: string; glow: string; orb: string }> = {
  emerald: { from: '#051a12', to: '#0e4430', glow: 'rgba(0,230,118,0.22)',    orb: '#00e676' },
  amber:   { from: '#211508', to: '#623814', glow: 'rgba(251,191,36,0.22)',   orb: '#fbbf24' },
  sky:     { from: '#071626', to: '#164065', glow: 'rgba(56,189,248,0.18)',   orb: '#38bdf8' },
  violet:  { from: '#180c26', to: '#4a1e82', glow: 'rgba(168,85,247,0.20)',  orb: '#a855f7' },
  rose:    { from: '#200c14', to: '#6a1f3c', glow: 'rgba(244,114,182,0.20)', orb: '#f472b6' },
  slate:   { from: '#111927', to: '#253245', glow: 'rgba(148,163,184,0.16)', orb: '#94a3b8' },
};

const CTA_STYLES: Record<BonusCodeToneId, { background: string; color: string; shadow: string }> = {
  emerald: { background: 'linear-gradient(135deg,#4fffac,#00e676)', color: '#02200d', shadow: 'rgba(0,230,118,0.35)' },
  amber:   { background: 'linear-gradient(135deg,#ffe8a0,#fbbf24)', color: '#3d2000', shadow: 'rgba(251,191,36,0.35)' },
  sky:     { background: 'linear-gradient(135deg,#b8ecff,#38bdf8)', color: '#05263e', shadow: 'rgba(56,189,248,0.30)' },
  violet:  { background: 'linear-gradient(135deg,#ddb8ff,#a855f7)', color: '#250050', shadow: 'rgba(168,85,247,0.30)' },
  rose:    { background: 'linear-gradient(135deg,#ffc8e0,#f472b6)', color: '#400020', shadow: 'rgba(244,114,182,0.30)' },
  slate:   { background: 'linear-gradient(135deg,#d0dce8,#94a3b8)', color: '#1a2532', shadow: 'rgba(148,163,184,0.25)' },
};

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-[14px] px-4 py-3"
      style={{
        background: 'var(--t-surface-2)',
        border: '1px solid var(--t-border)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,var(--t-border-2),transparent)',
        }}
      />
      <div
        className="text-[22px] font-black leading-none tracking-[-0.04em]"
        style={{ color: accent ? 'var(--t-accent)' : 'var(--t-text-1)' }}
      >
        {value}
      </div>
      <div
        className="mt-[5px] text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: 'var(--t-text-5)' }}
      >
        {label}
      </div>
    </div>
  );
}

// ── SectionRow ────────────────────────────────────────────────────────────────

function SectionRow({ label, count, accent }: { label: string; count: number; accent?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span
        className="flex-shrink-0 text-[10px] font-black uppercase tracking-[0.22em]"
        style={{ color: accent ? 'var(--t-accent)' : 'var(--t-text-5)' }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--t-border)' }} />
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          background: 'var(--t-surface-2)',
          border: '1px solid var(--t-border)',
          color: 'var(--t-text-5)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ── FeaturedHeroCard ──────────────────────────────────────────────────────────

function FeaturedHeroCard({
  entry,
  copied,
  onCopy,
}: {
  entry: BonusCodeEntry;
  copied: boolean;
  onCopy: (entry: BonusCodeEntry) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const tone = BONUS_CODE_TONES[entry.toneId];
  const grad = CARD_TOP_GRADIENTS[entry.toneId];
  const ctaStyle = CTA_STYLES[entry.toneId];

  function handleReveal() {
    setRevealed(true);
    onCopy(entry);
  }

  return (
    <article
      className="relative overflow-hidden rounded-[20px]"
      style={{
        border: `1px solid ${tone.borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `0 14px 44px ${grad.glow}, 0 2px 8px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = '';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      }}
    >
      {/* Top zone — coloured gradient */}
      <div
        className="relative overflow-hidden px-5 pb-4 pt-5"
        style={{ background: `linear-gradient(145deg, ${grad.from} 0%, ${grad.to} 100%)` }}
      >
        {/* Glow orb */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: -50, right: -50,
            width: 140, height: 140, borderRadius: '50%',
            background: `radial-gradient(circle, ${grad.orb}, transparent 70%)`,
            opacity: 0.22, pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 flex flex-col gap-2">
          {/* Bookmaker + Featured chip */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-[0.22em]"
              style={{ color: tone.accentColor }}
            >
              {entry.bookmaker}
            </span>
            {entry.isFeatured ? (
              <span
                className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]"
                style={{
                  background: 'rgba(0,230,118,0.15)',
                  border: '1px solid rgba(0,230,118,0.28)',
                  color: 'var(--t-accent)',
                }}
              >
                Featured
              </span>
            ) : null}
          </div>

          {/* Offer headline */}
          <h2
            className="text-[20px] font-black leading-[1.08] tracking-[-0.03em]"
            style={{ color: '#f4f8ff' }}
          >
            {entry.offer}
          </h2>

          {/* Description */}
          {entry.description ? (
            <p className="text-[11px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {entry.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Code reveal zone — dark background */}
      <div
        className="px-4 py-3"
        style={{
          background: 'var(--t-surface)',
          borderTop: `1px solid ${tone.borderColor}`,
        }}
      >
        {/* Label */}
        <div
          className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--t-text-5)' }}
        >
          Your bonus code
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Code box */}
          <div
            className="font-mono text-[14px] font-black tracking-[0.18em]"
            style={{
              flex: 1,
              background: tone.codeBackground,
              border: `1px dashed ${tone.codeBorder}`,
              borderRadius: 9,
              padding: '7px 12px',
              color: revealed ? 'var(--t-text-1)' : 'var(--t-text-5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {revealed ? entry.code : '••••••••••'}
          </div>

          {/* Reveal / Copied button */}
          <button
            type="button"
            onClick={handleReveal}
            className="flex-shrink-0 rounded-[9px] px-3 py-[7px] text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
              background: copied ? 'rgba(0,230,118,0.14)' : 'var(--t-surface-2)',
              border: copied ? '1px solid rgba(0,230,118,0.3)' : '1px solid var(--t-border)',
              color: copied ? '#9effcf' : 'var(--t-text-3)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {copied ? 'Copied ✓' : 'Reveal Code'}
          </button>

          {/* Claim CTA */}
          {entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-[9px] px-3 py-[7px] text-[10px] font-black uppercase tracking-[0.1em]"
              style={{
                textDecoration: 'none',
                background: ctaStyle.background,
                color: ctaStyle.color,
                boxShadow: `0 4px 14px ${ctaStyle.shadow}`,
                transition: 'filter 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.filter = 'brightness(1.08)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.filter = '';
                el.style.transform = '';
              }}
            >
              Claim →
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ── CompactRow ────────────────────────────────────────────────────────────────

function CompactRow({
  entry,
  copied,
  expanded,
  onCopy,
  onToggleExpand,
}: {
  entry: BonusCodeEntry;
  copied: boolean;
  expanded: boolean;
  onCopy: (entry: BonusCodeEntry) => void;
  onToggleExpand: (id: string) => void;
}) {
  const tone = BONUS_CODE_TONES[entry.toneId];
  const ctaStyle = CTA_STYLES[entry.toneId];
  const isExpandable = entry.isExpandable === true;

  function handleRowClick() {
    if (isExpandable) {
      onToggleExpand(entry.id);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{
        border: `1px solid ${tone.borderColor}`,
        background: 'var(--t-surface)',
      }}
    >
      {/* Main bar */}
      <div
        onClick={handleRowClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 16px',
          cursor: isExpandable ? 'pointer' : 'default',
        }}
      >
        {/* Bookmaker name */}
        <span
          className="font-black uppercase text-[10px] tracking-[0.18em] flex-shrink-0"
          style={{ color: tone.accentColor, width: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {entry.bookmaker}
        </span>

        {/* Offer text */}
        <span
          className="text-[11px] leading-[1.4]"
          style={{ flex: 1, color: 'var(--t-text-4)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}
        >
          {entry.offer}
        </span>

        {/* Code chip */}
        <span
          className="font-mono text-[11px] font-black tracking-[0.14em] flex-shrink-0"
          style={{
            background: tone.codeBackground,
            border: `1px dashed ${tone.codeBorder}`,
            borderRadius: 7,
            padding: '4px 8px',
            color: 'var(--t-text-3)',
          }}
        >
          {entry.code}
        </span>

        {/* Copy button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCopy(entry); }}
          className="flex-shrink-0 rounded-[7px] px-2 py-[5px] text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{
            background: copied ? 'rgba(0,230,118,0.14)' : tone.chipBackground,
            border: copied ? '1px solid rgba(0,230,118,0.3)' : `1px solid ${tone.codeBorder}`,
            color: copied ? '#9effcf' : tone.chipColor,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {copied ? '✓' : 'Copy'}
        </button>

        {/* Claim link */}
        {entry.href ? (
          <a
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 rounded-[7px] px-2 py-[5px] text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              textDecoration: 'none',
              background: ctaStyle.background,
              color: ctaStyle.color,
              boxShadow: `0 2px 8px ${ctaStyle.shadow}`,
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ''; }}
          >
            Claim
          </a>
        ) : null}

        {/* Expand chevron */}
        {isExpandable ? (
          <span
            aria-hidden="true"
            className="flex-shrink-0 text-[11px]"
            style={{
              color: 'var(--t-text-5)',
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        ) : null}
      </div>

      {/* Expanded panel */}
      {isExpandable && expanded ? (
        <div
          className="px-4 pb-3 pt-2 text-[11px] leading-[1.6]"
          style={{
            borderTop: `1px solid ${tone.borderColor}`,
            color: 'var(--t-text-4)',
          }}
        >
          {entry.description ? <p>{entry.description}</p> : null}
          {entry.terms ? (
            <p
              className="mt-1 text-[10px]"
              style={{ color: 'var(--t-text-5)' }}
            >
              {entry.terms}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BonusCodesPage() {
  const [config, setConfig] = useState(DEFAULT_BONUS_CODES_PAGE_CONFIG);
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setConfig(readBonusCodesPageConfig());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BONUS_CODES_STORAGE_KEY) sync();
    };
    sync();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(BONUS_CODES_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(BONUS_CODES_UPDATED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!copiedEntryId) return;
    const id = window.setTimeout(() => setCopiedEntryId(null), 1800);
    return () => window.clearTimeout(id);
  }, [copiedEntryId]);

  const activeEntries = useMemo(
    () => sortBonusCodeEntries(config.entries.filter((e) => e.isActive)),
    [config.entries],
  );
  const featuredEntries = useMemo(() => activeEntries.filter((e) => e.isFeatured), [activeEntries]);
  const standardEntries = useMemo(() => activeEntries.filter((e) => !e.isFeatured), [activeEntries]);

  async function handleCopy(entry: BonusCodeEntry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedEntryId(entry.id);
    } catch {
      setCopiedEntryId(null);
    }
  }

  function handleToggleExpand(id: string) {
    setExpandedEntryId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="px-4 py-5 md:px-5 md:py-6">

      {/* ── Hero ── */}
      <section
        className="relative mb-7 overflow-hidden rounded-[24px] px-7 py-5 md:px-9"
        style={{
          background: [
            'radial-gradient(ellipse at 0% 0%, rgba(0,230,118,0.12) 0%, transparent 50%)',
            'radial-gradient(ellipse at 100% 100%, rgba(99,102,241,0.10) 0%, transparent 50%)',
            'var(--t-surface)',
          ].join(', '),
          border: '1px solid var(--t-border)',
          boxShadow: 'var(--t-shadow-panel)',
        }}
      >
        {/* Top-right glow orb */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: -70, right: -70,
            width: 230, height: 230, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className="h-[5px] w-[5px] flex-shrink-0 rounded-full"
              style={{ background: 'var(--t-accent)', opacity: 0.8 }}
            />
            <span
              className="text-[10px] font-black uppercase tracking-[0.24em]"
              style={{ color: 'var(--t-accent)' }}
            >
              {config.copy.eyebrow}
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1
                className="text-[28px] font-black leading-[1.0] tracking-[-0.04em] md:text-[34px]"
                style={{ color: 'var(--t-text-1)' }}
              >
                {config.copy.title}
              </h1>
              <p
                className="mt-2 max-w-[52ch] text-[13px] leading-[1.65]"
                style={{ color: 'var(--t-text-4)' }}
              >
                {config.copy.subtitle}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <StatCard value={String(activeEntries.length)} label="Live offers" accent />
              <StatCard value={String(featuredEntries.length)} label="Featured" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Empty state ── */}
      {activeEntries.length === 0 ? (
        <section
          className="rounded-[20px] px-6 py-10 text-center"
          style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--t-text-5)' }}
          >
            No active offers
          </div>
          <h2
            className="mt-3 text-[20px] font-black tracking-[-0.03em]"
            style={{ color: 'var(--t-text-1)' }}
          >
            No bonus codes are live yet
          </h2>
          <p className="mt-2 text-[13px] leading-6" style={{ color: 'var(--t-text-4)' }}>
            Open the admin panel and activate bonus code cards. They appear here instantly.
          </p>
        </section>
      ) : null}

      {/* ── Featured ── */}
      {featuredEntries.length > 0 ? (
        <section className="mb-7">
          <SectionRow label={config.copy.featuredLabel} count={featuredEntries.length} accent />
          <div className="grid gap-4 md:grid-cols-2">
            {featuredEntries.map((entry) => (
              <FeaturedHeroCard
                key={entry.id}
                entry={entry}
                copied={copiedEntryId === entry.id}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Standard (compact rows) ── */}
      {standardEntries.length > 0 ? (
        <section>
          <SectionRow label={config.copy.allLabel} count={standardEntries.length} />
          <div className="flex flex-col gap-2">
            {standardEntries.map((entry) => (
              <CompactRow
                key={entry.id}
                entry={entry}
                copied={copiedEntryId === entry.id}
                expanded={expandedEntryId === entry.id}
                onCopy={handleCopy}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
