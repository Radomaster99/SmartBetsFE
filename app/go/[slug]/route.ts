import { NextRequest, NextResponse } from 'next/server';
import { slugToBookmakerUrl } from '@/lib/bookmakers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;

  const fixture = searchParams.get('fixture');
  const outcome = searchParams.get('outcome');
  const source = searchParams.get('source');

  // Structured click log — replace with your analytics sink when ready.
  console.log('[bookmaker-click]', {
    slug,
    fixture: fixture ?? null,
    outcome: outcome ?? null,
    source: source ?? null,
    ts: new Date().toISOString(),
  });

  const url = slugToBookmakerUrl(slug);

  if (!url) {
    // Unknown slug — send user back to the fixture if we have an ID, otherwise to matches.
    // We never show raw JSON errors in user-facing new tabs.
    const fallbackPath = fixture ? `/football/fixtures/${fixture}?tab=odds` : '/';
    const fallbackUrl = new URL(fallbackPath, request.url);
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  return NextResponse.redirect(url, { status: 302 });
}
