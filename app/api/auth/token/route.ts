import { NextResponse } from 'next/server';
import { getJwtToken } from '@/lib/api/client';

export async function POST() {
  try {
    const token = await getJwtToken();
    return NextResponse.json(token);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
