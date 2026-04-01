'use client';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';

export default function LeaguesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--t-text-1)' }}>Leagues</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ApiSportsWidget type="leagues" />
      </div>
    </div>
  );
}
