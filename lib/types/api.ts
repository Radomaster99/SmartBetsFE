export type StateBucket = 'Upcoming' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled' | 'Other' | 'Unknown';

export interface FixtureDto {
  id: number;
  apiFixtureId: number;
  season: number;
  kickoffAt: string;
  status: string;
  stateBucket: StateBucket;
  leagueId: number;
  leagueApiId: number;
  leagueName: string;
  countryName: string;
  homeTeamId: number;
  homeTeamApiId: number;
  homeTeamName: string;
  homeTeamLogoUrl: string;
  awayTeamId: number;
  awayTeamApiId: number;
  awayTeamName: string;
  awayTeamLogoUrl: string;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OddDto {
  fixtureId: number;
  apiFixtureId: number;
  bookmakerId: number;
  apiBookmakerId: number;
  bookmaker: string;
  marketName: string;
  homeOdd: number;
  drawOdd: number;
  awayOdd: number;
  collectedAtUtc: string;
}

export interface BestOddsDto {
  fixtureId: number;
  apiFixtureId: number;
  marketName: string;
  collectedAtUtc: string;
  bestHomeOdd: number;
  bestHomeBookmaker: string;
  bestDrawOdd: number;
  bestDrawBookmaker: string;
  bestAwayOdd: number;
  bestAwayBookmaker: string;
}

export interface FixtureDetailDto {
  fixture: FixtureDto;
  bestOdds: BestOddsDto | null;
  latestOddsCollectedAtUtc: string | null;
  fixturesUpcomingLastSyncedAtUtc: string | null;
  fixturesFullLastSyncedAtUtc: string | null;
  oddsLastSyncedAtUtc: string | null;
}

export interface StandingDto {
  rank: number;
  teamName: string;
  teamLogoUrl: string;
  points: number;
  goalsDiff: number;
  groupName: string;
  form: string;
  status: string;
  description: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface CountryDto {
  id: number;
  name: string;
  code: string;
  flagUrl: string;
}

export interface LeagueDto {
  id: number;
  apiLeagueId: number;
  name: string;
  season: number;
  countryId: number;
  countryName: string;
}

export interface BookmakerDto {
  id: number;
  apiBookmakerId: number;
  name: string;
}

export interface GlobalSyncState {
  entityType: string;
  lastSyncedAtUtc: string | null;
}

export interface LeagueSyncStatus {
  leagueApiId: number;
  season: number;
  leagueName: string;
  countryName: string;
  isActive: boolean;
  priority: number;
  teamsLastSyncedAtUtc: string | null;
  fixturesUpcomingLastSyncedAtUtc: string | null;
  fixturesFullLastSyncedAtUtc: string | null;
  standingsLastSyncedAtUtc: string | null;
  oddsLastSyncedAtUtc: string | null;
  bookmakersLastSyncedAtUtc: string | null;
}

export interface SyncStatusDto {
  generatedAtUtc: string;
  global: GlobalSyncState[];
  leagues: LeagueSyncStatus[];
}
