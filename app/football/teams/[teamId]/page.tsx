import { notFound, redirect } from 'next/navigation';
import { getTeam } from '@/lib/api/teams';
import { buildTeamPath } from '@/lib/team-links';

interface LegacyTeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function LegacyTeamPage({ params }: LegacyTeamPageProps) {
  const { teamId } = await params;
  const apiTeamId = Number(teamId);

  if (!Number.isFinite(apiTeamId) || apiTeamId <= 0) {
    notFound();
  }

  const team = await getTeam(apiTeamId).catch(() => null);
  if (!team) {
    notFound();
  }

  redirect(buildTeamPath(team.apiTeamId, team.name));
}
