'use client';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { OddDto } from '@/lib/types/api';

const col = createColumnHelper<OddDto>();

const columns = [
  col.accessor('bookmaker', {
    header: 'Bookmaker',
    cell: (info) => (
      <span className="text-[13px]" style={{ color: 'var(--t-text-2)' }}>
        {info.getValue()}
      </span>
    ),
  }),
  col.accessor('homeOdd', {
    header: '1 Home',
    cell: (info) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">1</span>
        <span className="odds-value">{info.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.accessor('drawOdd', {
    header: 'X Draw',
    cell: (info) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">X</span>
        <span className="odds-value">{info.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.accessor('awayOdd', {
    header: '2 Away',
    cell: (info) => (
      <div className="odds-btn" style={{ minWidth: 52 }}>
        <span className="odds-label">2</span>
        <span className="odds-value">{info.getValue().toFixed(2)}</span>
      </div>
    ),
  }),
  col.display({
    id: 'action',
    header: '',
    cell: ({ row }) => (
      <button
        type="button"
        title="Bookmaker links coming soon"
        className="rounded-md px-3 py-2 text-[11px] font-black tracking-wider transition-colors"
        style={{
          background: 'var(--t-accent)',
          border: '1px solid rgba(0,0,0,0.18)',
          color: '#04110b',
          boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.12)',
          cursor: 'pointer',
        }}
        aria-label={`Bet now with ${row.original.bookmaker}`}
      >
        BET NOW
      </button>
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
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className="px-4 py-2.5 text-left text-[10px] uppercase font-bold tracking-wider select-none"
                  style={{
                    color: 'var(--t-text-5)',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort()
                    ? header.column.getIsSorted() === 'asc'
                      ? ' ^'
                      : header.column.getIsSorted() === 'desc'
                        ? ' v'
                        : ''
                    : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid var(--t-border)',
                background: index % 2 === 0 ? 'transparent' : 'var(--t-surface)',
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
