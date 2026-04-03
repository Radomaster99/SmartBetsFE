'use client';
import type { FixtureDto } from '@/lib/types/api';
import { FixtureRow } from './FixtureRow';
import { TableSkeleton } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

interface Props {
  fixtures: FixtureDto[];
  isLoading?: boolean;
}

export function FixtureTable({ fixtures, isLoading }: Props) {
  const byLeague = fixtures.reduce<Record<string, { name: string; country: string; items: FixtureDto[] }>>((acc, f) => {
    const key = String(f.leagueApiId);
    if (!acc[key]) acc[key] = { name: f.leagueName, country: f.countryName, items: [] };
    acc[key].items.push(f);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed"><tbody><TableSkeleton rows={12} cols={5} /></tbody></table>
      </div>
    );
  }

  if (Object.keys(byLeague).length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <EmptyState title="No fixtures" description="No matches found for the selected date or filters." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {Object.entries(byLeague).map(([key, { name, country, items }]) => (
        <div key={key}>
          {/* League header */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10"
            style={{
              background: 'var(--t-surface)',
              borderBottom: '1px solid var(--t-border)',
              borderTop: '1px solid var(--t-border)',
            }}
          >
            <span className="text-[11px] font-semibold" style={{ color: 'var(--t-text-5)' }}>{country}</span>
            <span style={{ color: 'var(--t-border-2)' }}>·</span>
            <span className="text-[12px] font-bold" style={{ color: 'var(--t-text-2)' }}>{name}</span>
            <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)' }}>
              {items.length}
            </span>
          </div>

          <table className="w-full table-fixed">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--t-border)' }}>
                <th className="pl-3 pr-2 py-1.5 w-[80px] text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>Time</th>
                <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>Home</th>
                <th className="px-1 py-1.5 w-14 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>Score</th>
                <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>Away</th>
                <th className="pl-1 pr-3 py-1.5 w-[210px]" style={{ color: 'var(--t-text-5)' }}>
                  <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider">
                    <span>1</span>
                    <span>X</span>
                    <span>2</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <FixtureRow key={String(f.apiFixtureId)} fixture={f} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
