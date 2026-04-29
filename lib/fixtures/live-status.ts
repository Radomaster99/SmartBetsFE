import type { FixtureDto } from '@/lib/types/api';

export function isActivelyLiveFixture(fixture: Pick<FixtureDto, 'stateBucket' | 'status'>): boolean {
  if (fixture.stateBucket !== 'Live') {
    return false;
  }

  const normalizedStatus = fixture.status?.trim().toUpperCase();
  return normalizedStatus !== 'INT' && normalizedStatus !== 'SUSP';
}
