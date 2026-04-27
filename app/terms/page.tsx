import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/seo/structured-data';
import { buildAbsoluteUrl } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use',
  description: 'Terms of use for OddsDetector — the free football odds comparison tool.',
  canonicalPath: '/terms',
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={[
        buildWebPageSchema({ name: 'Terms of Use', description: 'Terms of use for OddsDetector — the free football odds comparison tool.', url: buildAbsoluteUrl('/terms'), dateModified: '2026-04-01' }),
        buildBreadcrumbSchema([{ name: 'OddsDetector', path: '/' }, { name: 'Terms of Use', path: '/terms' }]),
      ]} />
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-text-1)', marginBottom: 8 }}>Terms of Use</h1>
      <p style={{ fontSize: 12, color: 'var(--t-text-5)', marginBottom: 32 }}>Last updated: April 2026</p>

      <Section heading="1. Acceptance of Terms">
        By accessing or using OddsDetector (&ldquo;the Site&rdquo;), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Site.
      </Section>

      <Section heading="2. Service Description">
        OddsDetector is a free odds comparison tool that aggregates and displays football betting odds from regulated bookmakers. We do not operate as a bookmaker or accept bets. All betting transactions occur directly with the bookmaker of your choice.
      </Section>

      <Section heading="3. Age Restriction">
        You must be 18 years of age or older to use this Site. Gambling may not be legal in your jurisdiction — it is your responsibility to ensure compliance with local laws before placing any bets.
      </Section>

      <Section heading="4. Accuracy of Information">
        Odds and fixture data are provided for informational purposes only. While we strive for accuracy, odds change rapidly and we cannot guarantee that the prices displayed are current at the time you visit a bookmaker. Always verify odds directly with the bookmaker before placing a bet.
      </Section>

      <Section heading="5. Affiliate Relationships">
        OddsDetector earns revenue through affiliate partnerships with bookmakers. When you click through to a bookmaker and create an account or place a bet, we may receive a commission. This does not affect the odds or terms you receive from the bookmaker. See our <a href="/affiliate-disclosure" style={{ color: 'var(--t-accent)' }}>Affiliate Disclosure</a> for full details.
      </Section>

      <Section heading="6. Intellectual Property">
        All content on this Site, including text, graphics, and data compilations, is owned by or licensed to OddsDetector and protected by applicable intellectual property laws. You may not reproduce or distribute content without prior written consent.
      </Section>

      <Section heading="7. Limitation of Liability">
        OddsDetector is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any losses arising from your use of odds data displayed on this Site, including losses incurred through betting decisions made based on information from OddsDetector.
      </Section>

      <Section heading="8. Changes to Terms">
        We reserve the right to update these Terms at any time. Continued use of the Site after changes constitutes acceptance of the new Terms.
      </Section>

      <Section heading="9. Contact">
        For questions about these Terms, please contact us at legal@oddsdetector.com.
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
