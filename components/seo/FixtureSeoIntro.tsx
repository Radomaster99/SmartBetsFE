import Link from 'next/link';
import type { BestOddsDto } from '@/lib/types/api';

interface Props {
  homeName: string;
  awayName: string;
  leagueName: string;
  kickoffIso: string;
  venueName?: string | null;
  venueCity?: string | null;
  round?: string | null;
  stateBucket?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  bestOdds?: BestOddsDto | null;
  homeTeamPath: string;
  awayTeamPath: string;
  leaguePath: string;
}

function formatKickoff(iso: string): string {
  const date = new Date(iso);
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${dateStr} at ${timeStr} UTC`;
}

function buildIntroParagraph(props: Props): string {
  const { homeName, awayName, leagueName, kickoffIso, venueName, stateBucket, homeGoals, awayGoals } = props;
  const kickoff = formatKickoff(kickoffIso);
  const venuePart = venueName ? ` at ${venueName}` : '';

  if (stateBucket === 'Live') {
    const score = homeGoals != null && awayGoals != null ? ` Current score: ${homeGoals}-${awayGoals}.` : '';
    return `${homeName} are facing ${awayName} live in the ${leagueName}${venuePart}.${score} Compare live 1X2 odds, Asian handicap, and over/under markets across leading bookmakers below — odds update in real time as the match unfolds on OddsDetector.`;
  }

  if (stateBucket === 'Finished') {
    const score = homeGoals != null && awayGoals != null ? ` Final result: ${homeName} ${homeGoals}-${awayGoals} ${awayName}.` : '';
    return `${homeName} hosted ${awayName} in the ${leagueName}${venuePart} on ${kickoff}.${score} View closing odds, market movement, and full match statistics on OddsDetector.`;
  }

  return `${homeName} face ${awayName} in the ${leagueName}${venuePart} on ${kickoff}. Compare 1X2, both-teams-to-score, over/under, and Asian handicap odds across the top bookmakers below. Pre-match prices are tracked from open to close, and live odds update in real time once the match kicks off.`;
}

function describePrice(odd: number | null | undefined): string {
  if (odd == null) return '—';
  return odd.toFixed(2);
}

export function FixtureSeoIntro(props: Props) {
  const heading = `${props.homeName} vs ${props.awayName} Odds — ${props.leagueName}`;
  const intro = buildIntroParagraph(props);
  const best = props.bestOdds;

  return (
    <section
      aria-label="Match overview"
      style={{
        padding: '12px 18px 10px',
        borderBottom: '1px solid var(--t-border)',
        background: 'var(--t-surface)',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '18px',
          lineHeight: 1.25,
          fontWeight: 700,
          color: 'var(--t-text-1)',
          letterSpacing: '-0.01em',
        }}
      >
        {heading}
      </h1>

      <p
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {intro}
      </p>

      {best && (best.bestHomeOdd != null || best.bestDrawOdd != null || best.bestAwayOdd != null) ? (
        <dl
          style={{
            display: 'flex',
            gap: '14px',
            margin: '10px 0 0',
            fontSize: '11px',
            color: 'var(--t-text-5)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Best home: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--t-text-3)' }}>
              {describePrice(best.bestHomeOdd)}
              {best.bestHomeBookmaker ? ` (${best.bestHomeBookmaker})` : ''}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Best draw: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--t-text-3)' }}>
              {describePrice(best.bestDrawOdd)}
              {best.bestDrawBookmaker ? ` (${best.bestDrawBookmaker})` : ''}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Best away: </dt>
            <dd style={{ display: 'inline', margin: 0, color: 'var(--t-text-3)' }}>
              {describePrice(best.bestAwayOdd)}
              {best.bestAwayBookmaker ? ` (${best.bestAwayBookmaker})` : ''}
            </dd>
          </div>
        </dl>
      ) : null}

      <nav
        aria-label="Breadcrumb"
        style={{
          margin: '8px 0 0',
          fontSize: '11px',
          color: 'var(--t-text-5)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/football" style={{ color: 'var(--t-text-5)', textDecoration: 'none' }}>
          Football
        </Link>
        <span aria-hidden="true">›</span>
        <Link href={props.leaguePath} style={{ color: 'var(--t-text-5)', textDecoration: 'none' }}>
          {props.leagueName}
        </Link>
        <span aria-hidden="true">›</span>
        <Link href={props.homeTeamPath} style={{ color: 'var(--t-text-4)', textDecoration: 'none' }}>
          {props.homeName}
        </Link>
        <span aria-hidden="true" style={{ color: 'var(--t-text-6)' }}>vs</span>
        <Link href={props.awayTeamPath} style={{ color: 'var(--t-text-4)', textDecoration: 'none' }}>
          {props.awayName}
        </Link>
        {props.round ? <span style={{ marginLeft: 4, color: 'var(--t-text-6)' }}>· {props.round}</span> : null}
      </nav>
    </section>
  );
}
