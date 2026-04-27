import Link from 'next/link';

interface Props {
  variant: 'home' | 'football';
}

const POPULAR_LEAGUES: Array<{ name: string; href: string }> = [
  { name: 'Premier League', href: '/football/leagues/premier-league' },
  { name: 'La Liga', href: '/football/leagues/la-liga' },
  { name: 'Bundesliga', href: '/football/leagues/bundesliga' },
  { name: 'Serie A', href: '/football/leagues/serie-a' },
  { name: 'Ligue 1', href: '/football/leagues/ligue-1' },
  { name: 'Champions League', href: '/football/leagues/uefa-champions-league' },
  { name: 'Europa League', href: '/football/leagues/uefa-europa-league' },
  { name: 'World Cup', href: '/football/leagues/world-cup' },
];

export function BrandIntro({ variant }: Props) {
  const heading =
    variant === 'home'
      ? 'OddsDetector — Compare Football Odds Across Top Bookmakers'
      : 'Football Odds — Live Markets, Fixtures & Best Prices';

  const intro =
    variant === 'home'
      ? 'OddsDetector is a free football odds comparison tool. Compare live and pre-match prices across the top regulated bookmakers, find the strongest 1X2, both-teams-to-score, and over/under markets, and route your bet to the bookmaker offering the best value. Every match in every major league is tracked — odds update in real time during play.'
      : 'Compare live football odds across leading bookmakers in real time. Track upcoming fixtures, follow in-play markets, and find the best 1X2, both-teams-to-score, over/under, and Asian handicap prices on every match — from the Premier League and La Liga to the Champions League and beyond.';

  return (
    <section
      aria-label="OddsDetector overview"
      style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--t-border)',
        background: 'var(--t-surface)',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--t-text-1)',
        }}
      >
        {heading}
      </h1>
      <p
        style={{
          margin: '6px 0 0',
          maxWidth: '78ch',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'var(--t-text-4)',
        }}
      >
        {intro}
      </p>
      <nav
        aria-label="Popular leagues"
        style={{
          marginTop: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          fontSize: 11,
        }}
      >
        <span style={{ color: 'var(--t-text-5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Popular:
        </span>
        {POPULAR_LEAGUES.map((league) => (
          <Link
            key={league.name}
            href={league.href}
            style={{
              color: 'var(--t-accent)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {league.name}
          </Link>
        ))}
      </nav>
    </section>
  );
}
