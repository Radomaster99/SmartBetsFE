'use client';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { OddDto } from '@/lib/types/api';

const col = createColumnHelper<OddDto>();

const columns = [
  col.accessor('bookmaker', {
    header: 'Bookmaker',
    cell: (c) => <span className="text-[13px]" style={{ color: 'var(--t-text-2)' }}>{c.getValue()}</span>,
  }),
  col.accessor('homeOdd', {
    header: '1 Home',
    cell: (c) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">1</span>
        <span className="odds-value">{c.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.accessor('drawOdd', {
    header: 'X Draw',
    cell: (c) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">X</span>
        <span className="odds-value">{c.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.accessor('awayOdd', {
    header: '2 Away',
    cell: (c) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">2</span>
        <span className="odds-value">{c.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.accessor('collectedAtUtc', {
    header: 'Collected',
    cell: (c) => (
      <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
        {new Date(c.getValue()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    ),
  }),
];

export function OddsTable({ odds }: { odds: OddDto[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
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
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="px-4 py-2.5 text-left text-[10px] uppercase font-bold tracking-wider cursor-pointer select-none"
                  style={{ color: 'var(--t-text-5)' }}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid var(--t-border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--t-surface)',
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
