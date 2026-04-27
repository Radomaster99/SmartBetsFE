import { ImageResponse } from 'next/og';
import { getFixtureDetail } from '@/lib/api/fixtures';
import { parseFixtureSlugParam } from '@/lib/seo/slug';

export const alt = 'OddsDetector match';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Params {
  params: { fixtureId: string };
}

export default async function FixtureOgImage({ params }: Params) {
  const parsed = parseFixtureSlugParam(params.fixtureId);
  const detail = parsed ? await getFixtureDetail(parsed.apiFixtureId).catch(() => null) : null;

  const home = detail?.fixture.homeTeamName ?? 'Home';
  const away = detail?.fixture.awayTeamName ?? 'Away';
  const league = detail?.fixture.leagueName ?? 'Football';
  const kickoff = detail?.fixture.kickoffAt
    ? new Date(detail.fixture.kickoffAt).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    : '';

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
            fontSize: 24,
            color: '#00e676',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          OddsDetector · {league}
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>{home}</span>
          <span style={{ color: '#94a3b8', fontSize: 40, fontWeight: 600, margin: '8px 0' }}>vs</span>
          <span>{away}</span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 28,
          }}
        >
          <span style={{ color: '#94a3b8' }}>{kickoff || 'Compare odds & live markets'}</span>
          <span style={{ color: '#00e676', fontWeight: 800 }}>oddsdetector.com</span>
        </div>
      </div>
    ),
    size,
  );
}
