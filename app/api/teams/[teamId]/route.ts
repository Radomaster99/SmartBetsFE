import { NextRequest, NextResponse } from 'next/server';
import { getTeam } from '@/lib/api/teams';

interface RouteContext {
  params: Promise<{ teamId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { teamId } = await context.params;
  const apiTeamId = Number(teamId);

  if (!Number.isFinite(apiTeamId) || apiTeamId <= 0) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 });
  }

  try {
    const team = await getTeam(apiTeamId);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
