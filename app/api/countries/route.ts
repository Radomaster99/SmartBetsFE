import { NextResponse } from 'next/server';
import { getCountries } from '@/lib/api/countries';

export async function GET() {
  try {
    const data = await getCountries();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
