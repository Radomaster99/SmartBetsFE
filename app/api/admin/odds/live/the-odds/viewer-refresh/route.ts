import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

interface ViewerRefreshPatchBody {
  liveOddsHeartbeatEnabled?: boolean;
  LiveOddsHeartbeatEnabled?: boolean;
  enabled?: boolean;
  Enabled?: boolean;
  viewerDrivenRefreshEnabled?: boolean;
  ViewerDrivenRefreshEnabled?: boolean;
}

function readEnabled(body: ViewerRefreshPatchBody, searchParams: URLSearchParams): boolean | null {
  if (typeof body.liveOddsHeartbeatEnabled === 'boolean') {
    return body.liveOddsHeartbeatEnabled;
  }

  if (typeof body.LiveOddsHeartbeatEnabled === 'boolean') {
    return body.LiveOddsHeartbeatEnabled;
  }

  if (typeof body.viewerDrivenRefreshEnabled === 'boolean') {
    return body.viewerDrivenRefreshEnabled;
  }

  if (typeof body.ViewerDrivenRefreshEnabled === 'boolean') {
    return body.ViewerDrivenRefreshEnabled;
  }

  if (typeof body.enabled === 'boolean') {
    return body.enabled;
  }

  if (typeof body.Enabled === 'boolean') {
    return body.Enabled;
  }

  const fromQuery = searchParams.get('enabled');
  if (fromQuery === 'true') {
    return true;
  }

  if (fromQuery === 'false') {
    return false;
  }

  return null;
}

export async function PATCH(req: NextRequest) {
  let body: ViewerRefreshPatchBody = {};

  try {
    body = (await req.json()) as ViewerRefreshPatchBody;
  } catch {
    body = {};
  }

  const enabled = readEnabled(body, req.nextUrl.searchParams);

  if (enabled === null) {
    return NextResponse.json({ error: 'liveOddsHeartbeatEnabled boolean required' }, { status: 400 });
  } 

  try {
    const data = await apiFetch('/api/admin/odds/live/the-odds/viewer-refresh', {
      method: 'PATCH',
      body: JSON.stringify({
        liveOddsHeartbeatEnabled: enabled,
      }),
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[admin-the-odds-viewer-refresh] PATCH failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
