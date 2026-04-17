import { notFound, redirect } from 'next/navigation';
import { getTeam } from '@/lib/api/teams';
import { appendSearchParams, buildTeamPath } from '@/lib/team-links';

interface LegacyTeamPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          next.append(key, entry);
        }
      });
      continue;
    }

    if (value) {
      next.set(key, value);
    }
  }

  return next;
}

export default async function LegacyTeamPage({ params, searchParams }: LegacyTeamPageProps) {
  const { teamId } = await params;
  const apiTeamId = Number(teamId);

  if (!Number.isFinite(apiTeamId) || apiTeamId <= 0) {
    notFound();
  }

  const team = await getTeam(apiTeamId).catch(() => null);
  if (!team) {
    notFound();
  }

  const nextSearchParams = buildSearchParams(await searchParams);
  redirect(appendSearchParams(buildTeamPath(team.apiTeamId, team.name), nextSearchParams));
}
