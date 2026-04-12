export type StateBucket = 'Upcoming' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled' | 'Other' | 'Unknown';
export type LiveOddsSummarySource = 'live' | 'prematch' | 'none';
export type BookmakerIdentityType = 'real' | 'synthetic' | 'external';

export interface LiveOddsSummaryDto {
  apiFixtureId?: number;
  leagueApiId?: number;
  source: LiveOddsSummarySource;
  collectedAtUtc: string | null;
  bestHomeOdd: number | null;
  bestHomeBookmaker: string | null;
  bestDrawOdd: number | null;
  bestDrawBookmaker: string | null;
  bestAwayOdd: number | null;
  bestAwayBookmaker: string | null;
}

export interface FixtureDto {
  id: number;
  apiFixtureId: number;
  season: number;
  kickoffAt: string;
  status: string;
  statusLong?: string;
  elapsed?: number | null;
  statusExtra?: number | null;
  stateBucket: StateBucket;
  referee?: string | null;
  timezone?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  round?: string | null;
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
  liveOddsSummary?: LiveOddsSummaryDto | null;
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
  bookmakerIdentityType?: BookmakerIdentityType | null;
  sourceProvider?: 'api-football' | 'the-odds-api' | null;
  externalEventId?: string | null;
  externalBookmakerKey?: string | null;
  externalMarketKey?: string | null;
  bookmakerStableKey?: string | null;
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
  bestHomeOdd: number | null;
  bestHomeBookmaker: string | null;
  bestDrawOdd: number | null;
  bestDrawBookmaker: string | null;
  bestAwayOdd: number | null;
  bestAwayBookmaker: string | null;
}

export interface LiveOddsValueDto {
  outcomeLabel: string;
  line: string | null;
  odd: number | null;
  isMain: boolean;
  stopped: boolean;
  blocked: boolean;
  finished: boolean;
}

export interface LiveOddsMarketDto {
  fixtureId: number;
  apiFixtureId: number;
  bookmakerId: number;
  apiBookmakerId: number;
  bookmaker: string;
  bookmakerIdentityType?: BookmakerIdentityType | null;
  sourceProvider?: 'api-football' | 'the-odds-api' | null;
  externalEventId?: string | null;
  externalBookmakerKey?: string | null;
  externalMarketKey?: string | null;
  apiBetId: number;
  betName: string;
  collectedAtUtc?: string | null;
  lastSnapshotCollectedAtUtc?: string | null;
  lastSyncedAtUtc?: string | null;
  values: LiveOddsValueDto[];
}

export interface LiveOddsUpdatedDto {
  fixtureId: number;
  apiFixtureId: number;
  leagueApiId: number;
  collectedAtUtc: string;
  markets: LiveOddsMarketDto[];
}

export interface LiveOddsSummaryUpdatedDto extends LiveOddsSummaryDto {
  fixtureId: number;
  apiFixtureId: number;
  leagueApiId: number;
}

export interface LiveOddsViewersHeartbeatDto {
  receivedFixtureIds: number[];
  acceptedFixtureIds: number[];
  activeFixtureIds: number[];
  touchedAtUtc: string;
  viewerHeartbeatTtlSeconds: number;
  heartbeatAccepted?: boolean | null;
}

export interface LiveOddsViewersConfigDto {
  effectiveViewerDrivenRefreshEnabled: boolean;
  viewerDrivenRefreshEnabled?: boolean | null;
  adminViewerDrivenRefreshEnabled?: boolean | null;
  liveOddsHeartbeatEnabled?: boolean | null;
  theOddsProviderEnabled?: boolean | null;
  theOddsProviderConfigured?: boolean | null;
  configViewerDrivenRefreshEnabled?: boolean | null;
  readDrivenCatchUpEnabled?: boolean | null;
  viewerHeartbeatTtlSeconds?: number | null;
  viewerRefreshIntervalSeconds?: number | null;
  updatedAtUtc?: string | null;
  configAvailable?: boolean;
  error?: string | null;
}

export interface FixtureFreshnessDto {
  lastLiveStatusSyncedAtUtc?: string | null;
  lastEventSyncedAtUtc?: string | null;
  lastStatisticsSyncedAtUtc?: string | null;
  lastLineupsSyncedAtUtc?: string | null;
  lastPlayerStatisticsSyncedAtUtc?: string | null;
  lastPredictionSyncedAtUtc?: string | null;
  lastInjuriesSyncedAtUtc?: string | null;
}

export interface FixtureDetailDto {
  fixture: FixtureDto;
  liveOddsSummary: LiveOddsSummaryDto | null;
  bestOdds: BestOddsDto | null;
  latestOddsCollectedAtUtc: string | null;
  freshness?: FixtureFreshnessDto | null;
  fixturesLiveLastSyncedAtUtc?: string | null;
  fixturesUpcomingLastSyncedAtUtc: string | null;
  fixturesFullLastSyncedAtUtc: string | null;
  oddsLastSyncedAtUtc: string | null;
}

export interface StandingDto {
  teamId: number | null;
  apiTeamId: number;
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

export interface TeamDto {
  id: number;
  apiTeamId: number;
  name: string;
  code: string | null;
  logoUrl: string;
  founded: number | null;
  isNational: boolean;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  venueCapacity: number | null;
  venueSurface: string | null;
  venueImageUrl: string | null;
  countryId: number | null;
  countryName: string | null;
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
  liveOddsLastSyncedAtUtc?: string | null;
}

export interface SyncStatusDto {
  generatedAtUtc: string;
  global: GlobalSyncState[];
  leagues: LeagueSyncStatus[];
}
