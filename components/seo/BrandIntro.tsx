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
      style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
    >
      <h1>{heading}</h1>
      <p>{intro}</p>
      <nav aria-label="Popular leagues">
        {POPULAR_LEAGUES.map((league) => (
          <Link key={league.name} href={league.href}>
            {league.name}
          </Link>
        ))}
      </nav>
    </section>
  );
}
