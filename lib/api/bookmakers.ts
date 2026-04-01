import { apiFetch } from './client';
import type { BookmakerDto } from '../types/api';

export async function getBookmakers(): Promise<BookmakerDto[]> {
  return apiFetch<BookmakerDto[]>('/api/bookmakers');
}
