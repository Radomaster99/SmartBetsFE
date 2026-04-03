'use client';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import type { OddDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  odds: OddDto[];
  fixtureId?: number;
  movements?: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>;
}

const BEST_BG = 'rgba(0,230,118,0.08)';
const BEST_BORDER = '1px solid rgba(0,230,118,0.22)';

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
          borderColor: 'rgba(0,230,118,0.55)',
          boxShadow: '0 0 0 1px rgba(0,230,118,0.18)',
        }
      : movement === 'down'
        ? {
            background: 'rgba(239,83,80,0.14)',
            borderColor: 'rgba(239,83,80,0.5)',
            boxShadow: '0 0 0 1px rgba(239,83,80,0.14)',
          }
        : undefined;

  return (
    <div
      className="odds-btn"
      style={{
        position: 'relative',
        minWidth: 52,
        background: isBest ? BEST_BG : undefined,
        border: isBest ? BEST_BORDER : undefined,
        ...movementStyles,
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

  const maxHome = useMemo(() => (odds.length > 1 ? Math.max(...odds.map((o) => o.homeOdd)) : -1), [odds]);
  const maxDraw = useMemo(() => (odds.length > 1 ? Math.max(...odds.map((o) => o.drawOdd)) : -1), [odds]);
  const maxAway = useMemo(() => (odds.length > 1 ? Math.max(...odds.map((o) => o.awayOdd)) : -1), [odds]);

  const columns = useMemo<ColumnDef<OddDto>[]>(
    () => [
      {
        accessorKey: 'bookmaker',
        header: 'Bookmaker',
        cell: (info) => (
          <span className="text-[13px]" style={{ color: 'var(--t-text-2)' }}>
            {info.getValue() as string}
          </span>
        ),
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
            <div className="grid grid-cols-3 gap-1 min-w-[112px]">
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
                    className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-bold tracking-wide transition-opacity hover:opacity-90"
                    style={{
                      background: 'var(--t-accent)',
                      color: '#000',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
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
    data: odds,
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
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--t-border)' }}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className="px-4 py-2.5 text-left text-[11px] uppercase font-bold tracking-wider select-none"
                  style={{
                    color: 'var(--t-text-5)',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
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
  );
}
