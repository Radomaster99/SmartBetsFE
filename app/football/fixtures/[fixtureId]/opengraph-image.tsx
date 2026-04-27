import { ImageResponse } from 'next/og';
import { getFixtureDetail } from '@/lib/api/fixtures';
import { parseFixtureSlugParam } from '@/lib/seo/slug';

export const alt = 'OddsDetector match odds';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Params {
  params: Promise<{ fixtureId: string }>;
}

export default async function FixtureOgImage({ params }: Params) {
  const { fixtureId: param } = await params;
  const parsed = parseFixtureSlugParam(param);
  const detail = parsed ? await getFixtureDetail(parsed.apiFixtureId).catch(() => null) : null;

  const home = detail?.fixture.homeTeamName ?? 'Home';
  const away = detail?.fixture.awayTeamName ?? 'Away';
  const league = detail?.fixture.leagueName ?? 'Football';
  const isLive = detail?.fixture.stateBucket === 'Live';
  const isFinished = detail?.fixture.stateBucket === 'Finished';
  const hasScore = detail?.fixture.homeGoals != null && detail?.fixture.awayGoals != null;

  let matchLine: string;
  if (isFinished && hasScore) {
    matchLine = `${detail!.fixture.homeGoals} – ${detail!.fixture.awayGoals}`;
  } else if (isLive) {
    matchLine = '● LIVE';
  } else if (detail?.fixture.kickoffAt) {
    matchLine = new Date(detail.fixture.kickoffAt).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }) + ' UTC';
  } else {
    matchLine = 'Compare odds';
  }

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
          padding: '56px 80px',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            fontSize: 18,
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
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              display: 'flex',
              justifyContent: 'flex-end',
              textAlign: 'right',
            }}
          >
            {home}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
              minWidth: 140,
            }}
          >
            <div
              style={{
                fontSize: isFinished && hasScore ? 52 : 22,
                fontWeight: 800,
                color: isLive ? '#00e676' : isFinished && hasScore ? '#f4f8ff' : '#94a3b8',
                letterSpacing: isLive ? '0.06em' : '0',
                display: 'flex',
              }}
            >
              {isFinished && hasScore ? matchLine : isLive ? '● LIVE' : 'vs'}
            </div>
            {!(isFinished && hasScore) && (
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, display: 'flex', textAlign: 'center' }}>
                {isLive ? '' : matchLine}
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              display: 'flex',
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            {away}
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 20,
          }}
        >
          <span style={{ color: '#475569', fontWeight: 500 }}>Compare odds across top bookmakers</span>
          <span style={{ color: '#00e676', fontWeight: 800 }}>oddsdetector.com</span>
        </div>
      </div>
    ),
    size,
  );
}
