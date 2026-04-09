'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function fmtIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function labelValue(iso: string): string {
  const today = todayIso();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow) return 'Tomorrow';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  value: string;
  onChange: (date: string) => void;
}

export function CalendarPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position + sync view when opening
  useEffect(() => {
    if (!open) return;

    const btn = triggerRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }

    const d = new Date(`${value}T12:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [open, value]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const prevYear = useCallback(() => setViewYear((y) => y - 1), []);
  const nextYear = useCallback(() => setViewYear((y) => y + 1), []);

  // Monday-first grid
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayIso();

  const handleDayClick = (day: number) => {
    onChange(fmtIso(viewYear, viewMonth, day));
    setOpen(false);
  };

  const handleToday = () => {
    onChange(todayIso());
    setOpen(false);
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Date picker"
      style={{
        position: 'absolute',
        top: popoverPos.top,
        right: popoverPos.right,
        zIndex: 9999,
        width: 272,
        borderRadius: 14,
        border: '1px solid var(--t-border-2)',
        background: 'var(--t-surface)',
        boxShadow: '0 24px 48px rgba(5,8,18,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
        animation: 'calendarFadeIn 0.14s ease',
      }}
    >
      {/* Year row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px 0',
      }}>
        <NavBtn onClick={prevYear} label="Previous year"><DoubleChevron dir="left" /></NavBtn>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--t-text-4)',
          letterSpacing: '0.12em',
          fontFamily: "'Roboto Mono', monospace",
        }}>
          {viewYear}
        </span>
        <NavBtn onClick={nextYear} label="Next year"><DoubleChevron dir="right" /></NavBtn>
      </div>

      {/* Month row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px 10px',
        borderBottom: '1px solid var(--t-border)',
      }}>
        <NavBtn onClick={prevMonth} label="Previous month"><SingleChevron dir="left" /></NavBtn>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--t-text-1)',
          letterSpacing: '0.02em',
        }}>
          {MONTHS[viewMonth]}
        </span>
        <NavBtn onClick={nextMonth} label="Next month"><SingleChevron dir="right" /></NavBtn>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '8px 12px 4px',
        gap: 2,
      }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--t-text-5)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '2px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '2px 12px 10px',
        gap: 2,
      }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const iso = fmtIso(viewYear, viewMonth, day);
          return (
            <DayCell
              key={iso}
              day={day}
              isSelected={iso === value}
              isToday={iso === today}
              isPast={iso < today}
              onClick={() => handleDayClick(day)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px 12px',
        borderTop: '1px solid var(--t-border)',
      }}>
        <TodayBtn isActive={value === today} onClick={handleToday} />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Pick a date"
        title="Pick a specific date"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px 4px 8px',
          borderRadius: 8,
          border: `1px solid ${open ? 'var(--t-accent)' : 'var(--t-border-2)'}`,
          background: open ? 'rgba(0,230,118,0.07)' : 'var(--t-surface-2)',
          color: open ? 'var(--t-accent)' : 'var(--t-text-3)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'border-color 0.15s, background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <CalendarIcon active={open} />
        <span>{labelValue(value)}</span>
      </button>

      {/* Portal */}
      {typeof document !== 'undefined' && createPortal(popover, document.body)}

      <style>{`
        @keyframes calendarFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function DayCell({
  day,
  isSelected,
  isToday,
  isPast,
  onClick,
}: {
  day: number;
  isSelected: boolean;
  isToday: boolean;
  isPast: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  let bg = 'transparent';
  let border = '1px solid transparent';
  let color = isPast ? 'var(--t-text-4)' : 'var(--t-text-2)';
  let fontWeight = 500;

  if (isSelected) {
    bg = 'var(--t-accent)';
    color = '#03150a';
    fontWeight = 800;
  } else if (isToday) {
    border = '1px solid rgba(0,230,118,0.45)';
    color = 'var(--t-accent)';
    fontWeight = 700;
    if (hovered) bg = 'rgba(0,230,118,0.08)';
  } else if (hovered) {
    bg = 'var(--t-surface-2)';
    color = 'var(--t-text-1)';
    border = '1px solid var(--t-border-2)';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 32,
        borderRadius: 7,
        border,
        background: bg,
        color,
        fontSize: 11,
        fontWeight,
        fontFamily: "'Roboto Mono', monospace",
        cursor: 'pointer',
        transition: 'background 0.1s, border-color 0.1s, color 0.1s',
        outline: 'none',
      }}
    >
      {day}
    </button>
  );
}

function TodayBtn({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 20px',
        borderRadius: 7,
        border: `1px solid ${isActive || hovered ? 'rgba(0,230,118,0.4)' : 'var(--t-border-2)'}`,
        background: isActive || hovered ? 'rgba(0,230,118,0.08)' : 'var(--t-surface-2)',
        color: 'var(--t-accent)',
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        transition: 'all 0.12s ease',
      }}
    >
      Today
    </button>
  );
}

function NavBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 6,
        border: `1px solid ${hovered ? 'var(--t-border-2)' : 'transparent'}`,
        background: hovered ? 'var(--t-surface-2)' : 'transparent',
        color: hovered ? 'var(--t-text-2)' : 'var(--t-text-4)',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function SingleChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {dir === 'left'
        ? <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function DoubleChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {dir === 'left' ? (
        <>
          <path d="M10 11L6 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 11L3 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M4 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {active && <circle cx="8" cy="10.5" r="1.5" fill="currentColor" />}
    </svg>
  );
}
