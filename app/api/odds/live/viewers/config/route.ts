import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import type { LiveOddsViewersConfigDto } from '@/lib/types/api';

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeLiveViewersConfig(payload: unknown): LiveOddsViewersConfigDto {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  return {
    effectiveViewerDrivenRefreshEnabled:
      readBoolean(record.effectiveViewerDrivenRefreshEnabled ?? record.EffectiveViewerDrivenRefreshEnabled) ?? false,
    viewerDrivenRefreshEnabled:
      readBoolean(record.viewerDrivenRefreshEnabled ?? record.ViewerDrivenRefreshEnabled) ??
      readBoolean(record.globalViewerDrivenRefreshEnabled ?? record.GlobalViewerDrivenRefreshEnabled),
    adminViewerDrivenRefreshEnabled:
      readBoolean(record.configViewerDrivenRefreshEnabled ?? record.ConfigViewerDrivenRefreshEnabled) ??
      readBoolean(record.viewerDrivenRefreshEnabled ?? record.ViewerDrivenRefreshEnabled),
    liveOddsHeartbeatEnabled:
      readBoolean(record.liveOddsHeartbeatEnabled ?? record.LiveOddsHeartbeatEnabled),
    theOddsProviderEnabled:
      readBoolean(record.theOddsProviderEnabled ?? record.TheOddsProviderEnabled),
    theOddsProviderConfigured:
      readBoolean(record.theOddsProviderConfigured ?? record.TheOddsProviderConfigured),
    configViewerDrivenRefreshEnabled:
      readBoolean(record.configViewerDrivenRefreshEnabled ?? record.ConfigViewerDrivenRefreshEnabled),
    readDrivenCatchUpEnabled:
      readBoolean(record.readDrivenCatchUpEnabled ?? record.ReadDrivenCatchUpEnabled),
    viewerHeartbeatTtlSeconds:
      readNumber(record.viewerHeartbeatTtlSeconds ?? record.ViewerHeartbeatTtlSeconds),
    viewerRefreshIntervalSeconds:
      readNumber(record.viewerRefreshIntervalSeconds ?? record.ViewerRefreshIntervalSeconds),
    updatedAtUtc:
      readString(record.updatedAtUtc ?? record.UpdatedAtUtc),
    configAvailable: true,
    error: null,
  };
}

export async function GET() {
  try {
    const data = await apiFetch<unknown>('/api/odds/live/viewers/config');
    return NextResponse.json(normalizeLiveViewersConfig(data));
  } catch (error) {
    const message = String(error);
    console.warn('[live-viewers-config] Falling back to disabled heartbeat config:', message);
    return NextResponse.json({
      effectiveViewerDrivenRefreshEnabled: false,
      viewerDrivenRefreshEnabled: null,
      adminViewerDrivenRefreshEnabled: null,
      liveOddsHeartbeatEnabled: null,
      theOddsProviderEnabled: null,
      theOddsProviderConfigured: null,
      configViewerDrivenRefreshEnabled: null,
      readDrivenCatchUpEnabled: null,
      viewerHeartbeatTtlSeconds: null,
      viewerRefreshIntervalSeconds: null,
      updatedAtUtc: null,
      configAvailable: false,
      error: message,
    } satisfies LiveOddsViewersConfigDto);
  }
}
