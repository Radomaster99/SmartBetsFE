import { buildAbsoluteUrl } from '@/lib/site';

export function GET() {
  const body = [
    'User-Agent: Googlebot',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /go/',
    'Disallow: /user/',
    '',
    'User-Agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /go/',
    'Disallow: /user/',
    'Crawl-delay: 2',
    '',
    `Sitemap: ${buildAbsoluteUrl('/sitemap.xml')}`,
    `Host: ${buildAbsoluteUrl('/')}`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
