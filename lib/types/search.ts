export type GlobalSearchSuggestionType = 'fixture' | 'team' | 'league';

export interface GlobalSearchSuggestion {
  id: string;
  type: GlobalSearchSuggestionType;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

export interface GlobalSearchResponse {
  items: GlobalSearchSuggestion[];
}
