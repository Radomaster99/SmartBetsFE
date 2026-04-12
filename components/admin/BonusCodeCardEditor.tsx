'use client';

import { BONUS_CODE_TONES, type BonusCodeEntry, type BonusCodeToneId } from '@/lib/bonus-codes';

type BonusCodeCardEditorProps = {
  entry: BonusCodeEntry;
  index: number;
  total: number;
  onChange: (id: string, updates: Partial<BonusCodeEntry>) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
};

export function BonusCodeCardEditor({
  entry,
  index,
  total,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: BonusCodeCardEditorProps) {
  const tone = BONUS_CODE_TONES[entry.toneId];

  return (
    <div
      className="panel-shell rounded-xl p-4"
      style={{
        borderColor: tone.borderColor,
        boxShadow: `0 14px 36px ${tone.glow}`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: tone.accentColor }}>
            Offer {index + 1}
          </div>
          <div className="mt-1 text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {entry.bookmaker || 'New bookmaker'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMove(entry.id, 'up')}
            disabled={index === 0}
            className="chrome-btn rounded px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => onMove(entry.id, 'down')}
            disabled={index === total - 1}
            className="chrome-btn rounded px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40"
          >
            Down
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(entry.id)}
            className="chrome-btn rounded px-2.5 py-1.5 text-[11px] font-bold"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="rounded px-2.5 py-1.5 text-[11px] font-bold"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.28)',
              color: '#fecaca',
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Bookmaker
          </div>
          <input
            value={entry.bookmaker}
            onChange={(event) => onChange(entry.id, { bookmaker: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Badge
          </div>
          <input
            value={entry.badge ?? ''}
            onChange={(event) => onChange(entry.id, { badge: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
            placeholder="Exclusive / New / Ready to edit"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Offer headline
          </div>
          <input
            value={entry.offer}
            onChange={(event) => onChange(entry.id, { offer: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Bonus code
          </div>
          <input
            value={entry.code}
            onChange={(event) => onChange(entry.id, { code: event.target.value.toUpperCase() })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            CTA label
          </div>
          <input
            value={entry.ctaLabel}
            onChange={(event) => onChange(entry.id, { ctaLabel: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Landing URL
          </div>
          <input
            value={entry.href ?? ''}
            onChange={(event) => onChange(entry.id, { href: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
            placeholder="/go/betano?source=bonus-codes"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Description
          </div>
          <textarea
            value={entry.description}
            onChange={(event) => onChange(entry.id, { description: event.target.value })}
            className="input-shell min-h-[88px] w-full px-3 py-2 text-[12px]"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Terms note
          </div>
          <textarea
            value={entry.terms ?? ''}
            onChange={(event) => onChange(entry.id, { terms: event.target.value })}
            className="input-shell min-h-[72px] w-full px-3 py-2 text-[12px]"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Visual theme
          </div>
          <select
            value={entry.toneId}
            onChange={(event) => onChange(entry.id, { toneId: event.target.value as BonusCodeToneId })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          >
            {Object.entries(BONUS_CODE_TONES).map(([toneId, option]) => (
              <option key={toneId} value={toneId}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-5 pt-6">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
            <input
              type="checkbox"
              checked={entry.isActive}
              onChange={(event) => onChange(entry.id, { isActive: event.target.checked })}
              className="accent-green-400"
            />
            Active on page
          </label>

          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
            <input
              type="checkbox"
              checked={entry.isFeatured}
              onChange={(event) => onChange(entry.id, { isFeatured: event.target.checked })}
              className="accent-green-400"
            />
            Featured card
          </label>
        </div>
      </div>
    </div>
  );
}
