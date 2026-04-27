import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/seo/structured-data';
import { buildAbsoluteUrl } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for OddsDetector — how we collect, use, and protect your data.',
  canonicalPath: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={[
        buildWebPageSchema({ name: 'Privacy Policy', description: 'Privacy policy for OddsDetector — how we collect, use, and protect your data.', url: buildAbsoluteUrl('/privacy'), dateModified: '2026-04-01' }),
        buildBreadcrumbSchema([{ name: 'OddsDetector', path: '/' }, { name: 'Privacy Policy', path: '/privacy' }]),
      ]} />
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-text-1)', marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 12, color: 'var(--t-text-5)', marginBottom: 32 }}>Last updated: April 2026</p>

      <Section heading="1. Information We Collect">
        OddsDetector does not require account registration. We collect limited technical data including: browser type and version, pages visited and time spent, referring URLs, and device type. This data is collected via analytics tools and is used solely to improve the Site.
      </Section>

      <Section heading="2. Cookies">
        We use cookies and similar technologies to store your preferences (such as dark/light theme and pinned leagues), analyse site traffic, and serve relevant content. See our <a href="/cookies" style={{ color: 'var(--t-accent)' }}>Cookie Policy</a> for details. You can disable cookies in your browser settings, though some features may not function correctly.
      </Section>

      <Section heading="3. Third-Party Services">
        OddsDetector integrates with third-party services including bookmaker partners, widget providers, and analytics platforms. These services may collect data independently under their own privacy policies. We are not responsible for their data practices.
      </Section>

      <Section heading="4. Affiliate Links">
        When you click a bookmaker link on OddsDetector, you will be redirected to that bookmaker&rsquo;s site. The bookmaker will handle any personal data you provide to them under their own privacy policy. We may receive aggregate reporting data from bookmakers for commission purposes.
      </Section>

      <Section heading="5. Data Retention">
        We do not store personally identifiable information. Analytics data is retained in aggregated, anonymised form for up to 26 months before deletion.
      </Section>

      <Section heading="6. Your Rights">
        Depending on your jurisdiction, you may have rights to access, correct, or delete data held about you. To exercise these rights, contact us at privacy@oddsdetector.com.
      </Section>

      <Section heading="7. Children">
        OddsDetector is not directed at persons under 18. We do not knowingly collect data from minors.
      </Section>

      <Section heading="8. Changes to This Policy">
        We may update this Privacy Policy periodically. Material changes will be noted with an updated date at the top of this page.
      </Section>

      <Section heading="9. Contact">
        For privacy enquiries: privacy@oddsdetector.com
      </Section>
    </main>
    </>
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
