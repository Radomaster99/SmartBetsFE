import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/seo/structured-data';
import { buildAbsoluteUrl } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Cookie Policy',
  description: 'Cookie policy for OddsDetector — what cookies we use and why.',
  canonicalPath: '/cookies',
});

export default function CookiesPage() {
  return (
    <>
      <JsonLd data={[
        buildWebPageSchema({ name: 'Cookie Policy', description: 'Cookie policy for OddsDetector — what cookies we use and why.', url: buildAbsoluteUrl('/cookies'), dateModified: '2026-04-01' }),
        buildBreadcrumbSchema([{ name: 'OddsDetector', path: '/' }, { name: 'Cookie Policy', path: '/cookies' }]),
      ]} />
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-text-1)', marginBottom: 8 }}>Cookie Policy</h1>
      <p style={{ fontSize: 12, color: 'var(--t-text-5)', marginBottom: 32 }}>Last updated: April 2026</p>

      <Section heading="What Are Cookies">
        Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to site owners.
      </Section>

      <Section heading="Cookies We Use">
        OddsDetector uses the following types of cookies:
      </Section>

      <CookieTable />

      <Section heading="Preference Cookies">
        We store your theme preference (dark or light mode) and pinned leagues in your browser&rsquo;s localStorage. These are not transmitted to our servers and exist solely to improve your experience on return visits.
      </Section>

      <Section heading="Analytics Cookies">
        We use analytics tools to understand how visitors use the Site. Data collected is aggregated and anonymised — we cannot identify individual users from analytics data.
      </Section>

      <Section heading="Third-Party Cookies">
        Bookmakers and widget providers linked from OddsDetector may set their own cookies when you visit their sites. These are governed by their own cookie policies.
      </Section>

      <Section heading="Managing Cookies">
        You can control cookies through your browser settings. Disabling cookies may affect Site functionality, particularly theme and league preferences. Most browsers allow you to view, delete, and block cookies via their settings menus.
      </Section>

      <Section heading="Contact">
        For cookie-related queries: privacy@oddsdetector.com
      </Section>
    </main>
    </>
  );
}

function CookieTable() {
  const rows = [
    { name: 'sb-theme', purpose: 'Stores your dark/light theme preference', duration: 'Persistent (localStorage)', type: 'Preference' },
    { name: 'sb-pinned-leagues', purpose: 'Stores your pinned league selections', duration: 'Persistent (localStorage)', type: 'Preference' },
    { name: 'Analytics', purpose: 'Aggregated usage analytics', duration: 'Up to 26 months', type: 'Analytics' },
  ];
  return (
    <div style={{ overflowX: 'auto', marginBottom: 28 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--t-border)' }}>
            {['Name', 'Purpose', 'Duration', 'Type'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--t-text-5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} style={{ borderBottom: '1px solid var(--t-border)' }}>
              <td style={{ padding: '10px 12px', color: 'var(--t-text-2)', fontFamily: 'monospace' }}>{r.name}</td>
              <td style={{ padding: '10px 12px', color: 'var(--t-text-4)' }}>{r.purpose}</td>
              <td style={{ padding: '10px 12px', color: 'var(--t-text-4)' }}>{r.duration}</td>
              <td style={{ padding: '10px 12px', color: 'var(--t-text-4)' }}>{r.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text-1)', marginBottom: 8 }}>{heading}</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--t-text-4)' }}>{children}</p>
    </section>
  );
}
