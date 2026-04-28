'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { OddsDetectorLogo } from '@/components/branding/OddsDetectorLogo';

export function SiteFooter() {
  return (
    <footer
      className="site-footer"
      style={{ position: 'relative' }}
    >
      {/* Fade gradient — blends last content row into footer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -48,
          left: 'var(--shell-gutter-px, 248px)',
          right: 'var(--shell-gutter-px, 248px)',
          height: 48,
          background: 'linear-gradient(to bottom, transparent, var(--t-page-bg, #07101a))',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
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
        {/* Zone 0 — Brand pillars */}
        <BrandPillars />

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
            <FooterNavLink href="/">Football</FooterNavLink>
            <FooterNavLink href="/tennis">Tennis</FooterNavLink>
            <FooterNavLink href="/cs2">CS2</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="Football">
            <FooterNavLink href="/football">Fixtures</FooterNavLink>
            <FooterNavLink href="/football/fixtures">Today's Matches</FooterNavLink>
            <FooterNavLink href="/football/standings">Standings</FooterNavLink>
            <FooterNavLink href="/football/leagues">All Leagues</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="Top Leagues">
            <FooterNavLink href="/football/leagues/premier-league">Premier League</FooterNavLink>
            <FooterNavLink href="/football/leagues/la-liga">La Liga</FooterNavLink>
            <FooterNavLink href="/football/leagues/bundesliga">Bundesliga</FooterNavLink>
            <FooterNavLink href="/football/leagues/serie-a">Serie A</FooterNavLink>
            <FooterNavLink href="/football/leagues/ligue-1">Ligue 1</FooterNavLink>
            <FooterNavLink href="/football/leagues/uefa-champions-league">Champions League</FooterNavLink>
          </FooterNavCol>

          <FooterNavCol heading="Offers">
            <FooterNavLink href="/bonus-codes">Bonus Codes</FooterNavLink>
            <FooterNavLink href="/bonus-codes">Free Bet Offers</FooterNavLink>
            <FooterNavLink href="/bonus-codes">Welcome Bonuses</FooterNavLink>
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
            <OddsDetectorLogo size={28} wordmarkClassName="text-[13px]" muted />
            <RespBadge />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <LegalLink href="/terms">Terms</LegalLink>
            <Dot />
            <LegalLink href="/privacy">Privacy</LegalLink>
            <Dot />
            <LegalLink href="/cookies">Cookies</LegalLink>
            <Dot />
            <LegalLink href="/affiliate-disclosure">Affiliate disclosure</LegalLink>
          </div>

          <p
            style={{
              fontSize: '10px',
              color: 'var(--t-text-6, #374151)',
              width: '100%',
              marginTop: '4px',
            }}
          >
            © {new Date().getFullYear()} OddsDetector. Odds comparison for informational purposes. 18+ only. Please gamble responsibly.
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

function BrandPillars() {
  const pillars: Array<{ label: string; icon: React.ReactNode }> = [
    {
      label: 'Compare Odds',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="4"    width="16" height="2.5" rx="1.25" fill="var(--t-text-5, #4b5563)" />
          <rect x="2" y="8.75" width="10" height="2.5" rx="1.25" fill="var(--t-accent, #00e676)" />
          <rect x="2" y="13.5" width="13" height="2.5" rx="1.25" fill="var(--t-text-5, #4b5563)" />
        </svg>
      ),
    },
    {
      label: 'Find Value',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7"   stroke="var(--t-text-5, #4b5563)" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3"   stroke="var(--t-accent, #00e676)"  strokeWidth="1.5" />
          <circle cx="10" cy="10" r="1"   fill="var(--t-accent, #00e676)" />
        </svg>
      ),
    },
    {
      label: 'Detect Opportunities',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 3v2M14.24 5.76l-1.41 1.41M17 10h-2M14.24 14.24l-1.41-1.41M10 17v-2M5.76 14.24l1.41-1.41M3 10h2M5.76 5.76l1.41 1.41"
            stroke="var(--t-text-5, #4b5563)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="2.5" fill="var(--t-accent, #00e676)" />
        </svg>
      ),
    },
    {
      label: 'Beat the Bookies',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <polyline
            points="3,14 7,9 10,12 14,6 17,8"
            stroke="var(--t-text-5, #4b5563)"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points="14,6 17,6 17,9"
            stroke="var(--t-accent, #00e676)"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--t-border, rgba(255,255,255,0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        flexWrap: 'wrap',
      }}
    >
      {pillars.map((p) => (
        <div
          key={p.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: 'rgba(0,230,118,0.07)',
              borderTop: '1px solid rgba(0,230,118,0.18)',
              borderRight: '1px solid rgba(0,230,118,0.18)',
              borderBottom: '1px solid rgba(0,230,118,0.18)',
              borderLeft: '1px solid rgba(0,230,118,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {p.icon}
          </div>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--t-text-5, #4b5563)',
              textAlign: 'center' as const,
              maxWidth: 80,
              lineHeight: 1.4,
            }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
