import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebPageSchema, buildBreadcrumbSchema } from '@/lib/seo/structured-data';
import { buildAbsoluteUrl } from '@/lib/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Affiliate Disclosure',
  description: 'How OddsDetector earns revenue through affiliate partnerships with bookmakers.',
  canonicalPath: '/affiliate-disclosure',
});

export default function AffiliateDisclosurePage() {
  return (
    <>
      <JsonLd data={[
        buildWebPageSchema({ name: 'Affiliate Disclosure', description: 'How OddsDetector earns revenue through affiliate partnerships with bookmakers.', url: buildAbsoluteUrl('/affiliate-disclosure'), dateModified: '2026-04-01' }),
        buildBreadcrumbSchema([{ name: 'OddsDetector', path: '/' }, { name: 'Affiliate Disclosure', path: '/affiliate-disclosure' }]),
      ]} />
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--t-text-1)', marginBottom: 8 }}>Affiliate Disclosure</h1>
      <p style={{ fontSize: 12, color: 'var(--t-text-5)', marginBottom: 32 }}>Last updated: April 2026</p>

      <Section heading="How OddsDetector Makes Money">
        OddsDetector is free to use. We earn revenue through affiliate partnerships with bookmakers. When you click a &ldquo;Claim&rdquo; or bookmaker link on this Site and subsequently register an account or place a bet, we may receive a commission from that bookmaker.
      </Section>

      <Section heading="What This Means for You">
        Our affiliate relationships do not affect the odds or promotional terms you receive from bookmakers. The prices displayed on OddsDetector are pulled directly from bookmaker feeds — we do not inflate, alter, or selectively display odds based on commercial relationships.
      </Section>

      <Section heading="Editorial Independence">
        Bookmakers cannot pay to improve their placement in our odds comparison tables. Odds are ranked by price — the bookmaker offering the best value for a given outcome is always displayed first, regardless of affiliate status.
      </Section>

      <Section heading="Bonus Code Offers">
        The bonus codes and welcome offers featured on OddsDetector are selected based on offer value and terms. Featured placement of specific offers may reflect commercial arrangements, which will be clearly indicated where applicable. Always read the full terms and conditions on the bookmaker&rsquo;s site before claiming any offer.
      </Section>

      <Section heading="Responsible Gambling">
        OddsDetector promotes responsible gambling. We only partner with regulated bookmakers in licensed jurisdictions. If you or someone you know has a gambling problem, please seek help at <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--t-accent)' }}>BeGambleAware</a> or your local gambling support service.
      </Section>

      <Section heading="Contact">
        Questions about our affiliate relationships: partnerships@oddsdetector.com
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
