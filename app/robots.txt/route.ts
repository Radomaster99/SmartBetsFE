import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/admin/',
    `Host: ${host}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
