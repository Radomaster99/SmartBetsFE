import { apiFetch } from './client';
import type { CountryDto } from '../types/api';

export async function getCountries(): Promise<CountryDto[]> {
  return apiFetch<CountryDto[]>('/api/countries');
}
