import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tennis Odds — Coming Soon',
  description: 'Tennis odds monitoring is coming soon to OddsDetector.',
  robots: { index: false, follow: false },
};

export default function TennisPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center">
      <div className="text-6xl mb-6">🎾</div>
      <h1 className="text-2xl font-bold text-white mb-2">Tennis</h1>
      <p className="text-slate-500 text-sm">Coming soon &mdash; odds monitoring for tennis matches.</p>
    </div>
  );
}
