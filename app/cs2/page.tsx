import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CS2 Esports Odds — Coming Soon',
  description: 'CS2 esports odds monitoring is coming soon to OddsDetector.',
  robots: { index: false, follow: false },
};

export default function CS2Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-center">
      <div className="text-6xl mb-6">🎯</div>
      <h1 className="text-2xl font-bold text-white mb-2">CS2</h1>
      <p className="text-slate-500 text-sm">Coming soon &mdash; odds monitoring for CS2 esports.</p>
    </div>
  );
}
