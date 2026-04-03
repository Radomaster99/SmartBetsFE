'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { OddDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref, getBookmakerMeta, getBookmakerOrder } from '@/lib/bookmakers';

interface Props {
  odds: OddDto[];
  fixtureId?: number;
  movements?: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>;
}

const BEST_BG = 'rgba(0,230,118,0.08)';
const BEST_BORDER = '1px solid rgba(0,230,118,0.22)';

function BookmakerBadge({ bookmaker }: { bookmaker: string }) {
  const meta = getBookmakerMeta(bookmaker);

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black tracking-[0.08em]"
        style={{ background: `${meta.accent}18`, color: meta.accent, border: `1px solid ${meta.accent}33` }}
      >
        {meta.logoText}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
          {bookmaker}
        </div>
        <div className="mt-0.5 text-[10px]" style={{ color: 'var(--t-text-5)' }}>
          Bookmaker
        </div>
      </div>
    </div>
  );
}

function OddsCell({
  value,
  isBest,
  movement,
}: {
  value: number;
  isBest: boolean;
  movement?: LiveOddsMovementDirection;
}) {
  const movementStyles =
    movement === 'up'
      ? {
          background: 'rgba(0,230,118,0.14)',
          border: '1px solid rgba(0,230,118,0.55)',
          boxShadow: '0 0 0 1px rgba(0,230,118,0.18)',
          animation: 'odds-flash-up 0.55s ease-out',
        }
      : movement === 'down'
        ? {
            background: 'rgba(239,83,80,0.14)',
            border: '1px solid rgba(239,83,80,0.5)',
            boxShadow: '0 0 0 1px rgba(239,83,80,0.14)',
            animation: 'odds-flash-down 0.55s ease-out',
          }
        : null;

  return (
    <div
      className="odds-btn"
      style={{
        position: 'relative',
        minWidth: 52,
        ...(movementStyles ?? (isBest ? { background: BEST_BG, border: BEST_BORDER } : {})),
      }}
    >
      {movement ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 text-[10px] font-bold leading-none"
          style={{ color: movement === 'up' ? 'var(--t-accent)' : '#f87171' }}
        >
          {movement === 'up' ? '\u2191' : '\u2193'}
        </span>
      ) : null}
      <span className="odds-value" style={{ color: isBest ? 'var(--t-accent)' : undefined }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export function OddsTable({ odds, fixtureId, movements }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'homeOdd', desc: true }]);
  const orderedOdds = useMemo(
    () => [...odds].sort((a, b) => getBookmakerOrder(a.bookmaker) - getBookmakerOrder(b.bookmaker) || a.bookmaker.localeCompare(b.bookmaker)),
    [odds],
  );

  const maxHome = useMemo(() => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((odd) => odd.homeOdd)) : -1), [orderedOdds]);
  const maxDraw = useMemo(() => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((odd) => odd.drawOdd)) : -1), [orderedOdds]);
  const maxAway = useMemo(() => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((odd) => odd.awayOdd)) : -1), [orderedOdds]);

  const columns = useMemo<ColumnDef<OddDto>[]>(
    () => [
      {
        accessorKey: 'bookmaker',
        header: 'Bookmaker',
        cell: (info) => <BookmakerBadge bookmaker={info.getValue() as string} />,
      },
      {
        accessorKey: 'homeOdd',
        header: 'Home',
        cell: (info) => (
          <OddsCell
            value={info.getValue() as number}
            isBest={(info.getValue() as number) === maxHome}
            movement={movements?.[info.row.original.bookmaker]?.home}
          />
        ),
      },
      {
        accessorKey: 'drawOdd',
        header: 'Draw',
        cell: (info) => (
          <OddsCell
            value={info.getValue() as number}
            isBest={(info.getValue() as number) === maxDraw}
            movement={movements?.[info.row.original.bookmaker]?.draw}
          />
        ),
      },
      {
        accessorKey: 'awayOdd',
        header: 'Away',
        cell: (info) => (
          <OddsCell
            value={info.getValue() as number}
            isBest={(info.getValue() as number) === maxAway}
            movement={movements?.[info.row.original.bookmaker]?.away}
          />
        ),
      },
      {
        id: 'action',
        header: 'Bet',
        cell: ({ row }) => {
          const targetFixtureId = fixtureId ?? row.original.apiFixtureId;
          const bookmaker = row.original.bookmaker;
          const options = [
            { label: '1', outcome: 'home' as const },
            { label: 'X', outcome: 'draw' as const },
            { label: '2', outcome: 'away' as const },
          ];

          return (
            <div className="grid min-w-[112px] grid-cols-3 gap-1">
              {options.map((option) => {
                const href = buildBookmakerHref(bookmaker, {
                  fixture: targetFixtureId,
                  outcome: option.outcome,
                  source: 'odds-table',
                });

                return (
                  <a
                    key={option.outcome}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-btn inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-bold tracking-wide"
                    style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Bet ${option.label} with ${bookmaker}`}
                    title={`Bet ${option.label} with ${bookmaker}`}
                  >
                    {option.label}
                  </a>
                );
              })}
            </div>
          );
        },
      },
    ],
    [fixtureId, maxAway, maxDraw, maxHome, movements],
  );

  const table = useReactTable({
    data: orderedOdds,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (odds.length === 0) {
    return (
      <div className="py-10 text-center text-[13px]" style={{ color: 'var(--t-text-5)' }}>
        No odds available for this fixture.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg panel-shell">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
          Comparing {orderedOdds.length} bookmakers
        </div>
        <div className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
          Best prices glow green
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className="select-none px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      color: 'var(--t-text-5)',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? <span> {'\u2191'}</span> : header.column.getIsSorted() === 'desc' ? <span> {'\u2193'}</span> : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                style={{ borderBottom: '1px solid var(--t-border)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = 'var(--t-surface-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
