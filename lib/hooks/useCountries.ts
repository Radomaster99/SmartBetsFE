'use client';
import { useQuery } from '@tanstack/react-query';
import type { CountryDto } from '../types/api';

async function fetchCountries(): Promise<CountryDto[]> {
  const res = await fetch('/api/countries');
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 300_000,
  });
}
