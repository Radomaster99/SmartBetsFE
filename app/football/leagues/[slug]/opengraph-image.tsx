import { ImageResponse } from 'next/og';
import { getLeagues } from '@/lib/api/leagues';
import { leagueNameToSlug } from '@/lib/league-links';

export const alt = 'OddsDetector league odds';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

interface Params {
  params: { slug: string };
}

export default async function LeagueOgImage({ params }: Params) {
  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);
  const league = leagues.find((l) => leagueNameToSlug(l.name) === params.slug);
  const leagueName = league?.name ?? 'Football League';
  const country = league?.countryName ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #07101a 0%, #0e1f2e 60%, #0a3a25 100%)',
          color: '#f4f8ff',
          padding: '64px 80px',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: '#00e676',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          OddsDetector{country ? ` · ${country}` : ''}
        </div>

        <div
          style={{
            marginTop: 52,
            fontSize: 82,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            display: 'flex',
          }}
        >
          {leagueName}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: '#94a3b8',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          Odds · Fixtures · Standings
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 26,
          }}
        >
          <span style={{ color: '#00e676', fontWeight: 800 }}>oddsdetector.com</span>
        </div>
      </div>
    ),
    size,
  );
}
