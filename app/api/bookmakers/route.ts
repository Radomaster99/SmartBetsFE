import { NextResponse } from 'next/server';
import { getBookmakers } from '@/lib/api/bookmakers';

export async function GET() {
  try {
    const data = await getBookmakers();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
