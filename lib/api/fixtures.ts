import { apiFetch, apiFetchWithJwt, buildQuery } from './client';
import type {
  FixtureDto,
  PagedResultDto,
  FixtureDetailDto,
  FixtureCornersDto,
  FixtureTeamStatisticsDto,
  OddDto,
  BestOddsDto,
  LiveOddsMarketDto,
} from '../types/api';
import type { FixtureFilters } from '../types/filters';

export async function getFixtures(filters: FixtureFilters): Promise<PagedResultDto<FixtureDto>> {
  const q = buildQuery({
    leagueId: filters.leagueId,
    teamId: filters.teamId,
    season: filters.season,
    state: filters.state,
    includeLiveOddsSummary: filters.includeLiveOddsSummary,
    date: filters.date,
    from: filters.from,
    to: filters.to,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 50,
    direction: filters.direction ?? 'asc',
  });
  return apiFetch<PagedResultDto<FixtureDto>>(`/api/fixtures/query${q}`);
}

export async function getFixtureDetail(apiFixtureId: number): Promise<FixtureDetailDto> {
  return apiFetch<FixtureDetailDto>(`/api/fixtures/${apiFixtureId}`);
}

export async function getFixtureOdds(apiFixtureId: number, marketName?: string): Promise<OddDto[]> {
  const q = buildQuery({ marketName, latestOnly: true });
  return apiFetch<OddDto[]>(`/api/fixtures/${apiFixtureId}/odds${q}`);
}

export async function getFixtureBestOdds(apiFixtureId: number, marketName?: string): Promise<BestOddsDto> {
  const q = buildQuery({ marketName });
  return apiFetch<BestOddsDto>(`/api/fixtures/${apiFixtureId}/best-odds${q}`);
}

export async function getFixtureLiveOdds(
  apiFixtureId: number,
  options?: { betId?: number; latestOnly?: boolean },
): Promise<LiveOddsMarketDto[]> {
  const q = buildQuery({
    betId: options?.betId,
    latestOnly: options?.latestOnly ?? true,
  });

  return apiFetchWithJwt<LiveOddsMarketDto[]>(`/api/fixtures/${apiFixtureId}/odds/live${q}`);
}

export async function getFixtureStatistics(apiFixtureId: number): Promise<FixtureTeamStatisticsDto[]> {
  return apiFetch<FixtureTeamStatisticsDto[]>(`/api/fixtures/${apiFixtureId}/statistics`);
}

export async function getFixtureCorners(apiFixtureId: number): Promise<FixtureCornersDto> {
  return apiFetch<FixtureCornersDto>(`/api/fixtures/${apiFixtureId}/corners`);
}
