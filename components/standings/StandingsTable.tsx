'use client';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import type { StandingDto } from '@/lib/types/api';
import { TeamLogo } from '@/components/shared/TeamLogo';

const col = createColumnHelper<StandingDto>();

function FormDots({ form }: { form: string }) {
  if (!form) return null;
  const results = form.replace(/[^WDL]/gi, '').split('').slice(-5);
  return (
    <div className="flex items-center gap-0.5">
      {results.map((r, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black"
          style={{
            background: r.toUpperCase() === 'W' ? '#00e676' : r.toUpperCase() === 'D' ? '#f59e0b' : '#ef5350',
            color: '#000',
          }}
        >
          {r.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

const columns = [
  col.accessor('rank', {
    header: '#',
    cell: (c) => <span className="text-[13px] font-bold w-5 inline-block text-center" style={{ color: 'var(--t-text-4)' }}>{c.getValue()}</span>,
  }),
  col.display({
    id: 'team',
    header: 'Team',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <TeamLogo src={row.original.teamLogoUrl} alt={row.original.teamName} size={20} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--t-text-1)' }}>{row.original.teamName}</span>
      </div>
    ),
  }),
  col.accessor('played',  { header: 'P',  cell: (c) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{c.getValue()}</span> }),
  col.accessor('win',     { header: 'W',  cell: (c) => <span className="text-[12px] font-semibold" style={{ color: '#00e676' }}>{c.getValue()}</span> }),
  col.accessor('draw',    { header: 'D',  cell: (c) => <span className="text-[12px]" style={{ color: '#f59e0b' }}>{c.getValue()}</span> }),
  col.accessor('lose',    { header: 'L',  cell: (c) => <span className="text-[12px]" style={{ color: '#ef5350' }}>{c.getValue()}</span> }),
  col.accessor('goalsFor',     { header: 'GF', cell: (c) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{c.getValue()}</span> }),
  col.accessor('goalsAgainst', { header: 'GA', cell: (c) => <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>{c.getValue()}</span> }),
  col.accessor('goalsDiff', {
    header: 'GD',
    cell: (c) => {
      const v = c.getValue();
      return <span className="text-[12px] font-medium" style={{ color: v > 0 ? '#00e676' : v < 0 ? '#ef5350' : 'var(--t-text-4)' }}>{v > 0 ? `+${v}` : v}</span>;
    },
  }),
  col.accessor('points', {
    header: 'Pts',
    cell: (c) => <span className="text-[13px] font-black" style={{ color: 'var(--t-text-1)' }}>{c.getValue()}</span>,
  }),
  col.accessor('form', {
    header: 'Form',
    cell: (c) => <FormDots form={c.getValue()} />,
  }),
  col.accessor('description', {
    header: '',
    cell: (c) => {
      const v = c.getValue();
      if (!v) return null;
      const isPromo = v.toLowerCase().includes('promot') || v.toLowerCase().includes('champi');
      const isRele  = v.toLowerCase().includes('relega');
      return (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
          style={{
            background: isPromo ? 'rgba(0,230,118,0.15)' : isRele ? 'rgba(239,83,80,0.15)' : 'var(--t-surface-2)',
            color:      isPromo ? '#00e676'              : isRele ? '#ef5350'               : 'var(--t-text-4)',
          }}
        >
          {v.length > 12 ? v.slice(0, 12) + '…' : v}
        </span>
      );
    },
  }),
];

export function StandingsTable({ standings }: { standings: StandingDto[] }) {
  const table = useReactTable({ data: standings, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2.5 text-left text-[10px] uppercase font-bold tracking-wider whitespace-nowrap" style={{ color: 'var(--t-text-6)' }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className="transition-colors"
              style={{
                borderBottom: '1px solid var(--t-border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--t-surface)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--t-surface-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'var(--t-surface)'; }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2.5">
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
