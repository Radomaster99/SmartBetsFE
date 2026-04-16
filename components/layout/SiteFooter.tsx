'use client';

import type { ReactNode } from 'react';

export function SiteFooter() {
  return (
    <footer
      className="site-footer"
      style={{
        marginInline: 'calc(-1 * var(--shell-gutter-px, 248px))',
      }}
    >
      {/* Solid center strip — z-index 1 sits above the glass pseudo-elements */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginInline: 'var(--shell-gutter-px, 248px)',
          background: 'var(--t-page-bg, #07101a)',
          borderTop: '1px solid var(--t-border, rgba(255,255,255,0.08))',
        }}
      >
        {/* Zone 1 — Navigation */}
        <nav
          aria-label="Footer navigation"
          style={{
            padding: '28px 28px 24px',
            borderBottom: '1px solid var(--t-border, rgba(255,255,255,0.08))',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}
        >
          <FooterNavCol heading="Sports">
            <FooterNavLink href="/football">Football</FooterNavLink>
            <FooterNavLink href="/tennis">Tennis</FooterNavLink>
            <FooterNavLink href="/cs2">CS2</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="Football">
            <FooterNavLink href="/football">Fixtures</FooterNavLink>
            <FooterNavLink href="/football/standings">Standings</FooterNavLink>
            <FooterNavLink href="/football">Live Odds</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="Offers">
            <FooterNavLink href="/bonus-codes">Bonus Codes</FooterNavLink>
            <FooterNavLink href="/bonus-codes">Featured Deals</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="About">
            <FooterNavLink href="#">How it works</FooterNavLink>
            <FooterNavLink href="#">Responsible Gambling</FooterNavLink>
            <FooterNavLink href="#">Contact</FooterNavLink>
          </FooterNavCol>
        </nav>

        {/* Zone 2 — Legal bar */}
        <div
          style={{
            padding: '14px 28px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'var(--t-text-6, #374151)',
              }}
            >
              Smart<span style={{ color: 'var(--t-accent, #00e676)' }}>Bets</span>
            </span>
            <RespBadge />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <LegalLink href="#">Terms</LegalLink>
            <Dot />
            <LegalLink href="#">Privacy</LegalLink>
            <Dot />
            <LegalLink href="#">Cookies</LegalLink>
            <Dot />
            <LegalLink href="#">Affiliate disclosure</LegalLink>
          </div>

          <p
            style={{
              fontSize: '10px',
              color: 'var(--t-text-6, #374151)',
              width: '100%',
              marginTop: '4px',
            }}
          >
            © {new Date().getFullYear()} SmartBets. Odds comparison for informational purposes. 18+ only. Please gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterNavCol({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div>
      <h4
        style={{
          fontSize: '9px',
          fontWeight: 900,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--t-text-5, #4b5563)',
          marginBottom: '10px',
        }}
      >
        {heading}
      </h4>
      {children}
    </div>
  );
}

function FooterNavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        fontSize: '12px',
        color: 'var(--t-text-4, #6b7280)',
        textDecoration: 'none',
        lineHeight: '2.1',
      }}
    >
      {children}
    </a>
  );
}

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        fontSize: '10px',
        color: 'var(--t-text-6, #374151)',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

function Dot() {
  return <span style={{ color: 'var(--t-text-6, #374151)', fontSize: '10px' }}>·</span>;
}

function RespBadge() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--t-text-5, #4b5563)',
      }}
    >
      <span
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          padding: '1px 4px',
          fontSize: '8px',
          fontWeight: 900,
          color: 'var(--t-text-4, #6b7280)',
        }}
      >
        18+
      </span>
      Gamble Responsibly
    </div>
  );
}
