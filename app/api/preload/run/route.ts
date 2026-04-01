import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST() {
  try {
    const data = await apiFetch('/api/preload/run', { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
