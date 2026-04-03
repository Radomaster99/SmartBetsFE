import type { StateBucket } from './api';

export interface FixtureFilters {
  date?: string;
  from?: string;
  to?: string;
  leagueId?: number;
  teamId?: number;
  season?: number;
  state?: StateBucket;
  page?: number;
  pageSize?: number;
  direction?: 'asc' | 'desc';
}
