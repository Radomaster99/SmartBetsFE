import type { Metadata } from 'next';
import Link from 'next/link';
import { getLeagues } from '@/lib/api/leagues';
import { buildAbsoluteUrl } from '@/lib/site';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from '@/lib/seo/structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildLeagueHubPath } from '@/lib/seo/slug';

export const revalidate = 3600;

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Football Leagues & Competitions',
    description:
      'Browse every football league and competition tracked on OddsDetector — Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League, and more, with live odds and standings.',
    canonicalPath: '/football/leagues',
  });
}

interface CountryGroup {
  countryName: string;
  leagues: Array<{ apiLeagueId: number; name: string; season: number }>;
}

function groupByCountry(leagues: Awaited<ReturnType<typeof getLeagues>>): CountryGroup[] {
  const groups = new Map<string, CountryGroup>();
  for (const league of leagues) {
    const country = league.countryName || 'Other';
    if (!groups.has(country)) {
      groups.set(country, { countryName: country, leagues: [] });
    }
    groups.get(country)!.leagues.push({
      apiLeagueId: league.apiLeagueId,
      name: league.name,
      season: league.season,
    });
  }
  return Array.from(groups.values()).sort((a, b) => a.countryName.localeCompare(b.countryName));
}

export default async function LeaguesDirectoryPage() {
  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);
  const groups = groupByCountry(leagues);

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Football', path: '/football' },
    { name: 'Leagues', path: '/football/leagues' },
  ]);

  const collection = buildCollectionPageSchema({
    name: 'Football Leagues & Competitions',
    description: 'Directory of football leagues and competitions on OddsDetector.',
    url: buildAbsoluteUrl('/football/leagues'),
  });

  const itemList = buildItemListSchema(
    'Football leagues',
    leagues.slice(0, 100).map((l) => ({
      name: l.name,
      path: buildLeagueHubPath(l.name),
    })),
  );

  return (
    <>
      <JsonLd data={[breadcrumbs, collection, itemList]} />
      <main style={{ padding: '20px 18px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--t-text-1)',
            }}
          >
            Football Leagues & Competitions
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              maxWidth: '64ch',
              fontSize: 13,
              lineHeight: 1.65,
              color: 'var(--t-text-4)',
            }}
          >
            Browse every football league and competition tracked on OddsDetector — from the Premier League and La Liga
            to the Champions League and World Cup. Each league hub gives you upcoming fixtures, current standings, and
            best odds across leading bookmakers.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {groups.map((group) => (
            <article
              key={group.countryName}
              style={{
                background: 'var(--t-surface)',
                border: '1px solid var(--t-border)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--t-text-5)',
                }}
              >
                {group.countryName}
              </h2>
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
                {group.leagues.map((league) => (
                  <li key={league.apiLeagueId} style={{ padding: '4px 0' }}>
                    <Link
                      href={buildLeagueHubPath(league.name)}
                      style={{
                        color: 'var(--t-text-2)',
                        textDecoration: 'none',
                        fontSize: 13,
                      }}
                    >
                      {league.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
