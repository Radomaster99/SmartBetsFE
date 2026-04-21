import { redirect } from 'next/navigation';
import { buildSearchParams, type FootballLandingPageProps } from './FootballLandingPage';

export default async function FootballPageRedirect({ searchParams }: FootballLandingPageProps) {
  const params = buildSearchParams(await searchParams);
  const query = params.toString();
  redirect(query ? `/?${query}` : '/');
}
