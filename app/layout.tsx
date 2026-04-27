import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { WidgetsProvider } from '@/components/widgets/WidgetsProvider';
import { AppShell } from '@/components/layout/AppShell';
import { getSiteUrl } from '@/lib/site';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'OddsDetector — Compare Football Odds & Live Betting Markets',
    template: '%s | OddsDetector',
  },
  description:
    'Compare football odds across the top bookmakers. Live and pre-match prices, fixtures, standings, and bookmaker bonus codes — all on OddsDetector.',
  applicationName: 'OddsDetector',
  keywords: [
    'football odds',
    'odds comparison',
    'live football odds',
    'betting odds',
    'compare bookmaker odds',
    'best football odds',
    'live betting',
    'odds detector',
  ],
  authors: [{ name: 'OddsDetector' }],
  category: 'sports',
  icons: {
    icon: '/icon',
    shortcut: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    type: 'website',
    siteName: 'OddsDetector',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const widgetKey =
    process.env.NEXT_PUBLIC_WIDGET_KEY ??
    process.env.WIDGET_KEY ??
    process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_KEY ??
    process.env.API_SPORTS_WIDGET_KEY ??
    '';
  const widgetFootballUrl =
    process.env.NEXT_PUBLIC_WIDGET_FOOTBALL_URL ??
    process.env.WIDGET_FOOTBALL_URL ??
    '';
  const widgetMediaUrl =
    process.env.NEXT_PUBLIC_WIDGET_MEDIA_URL ??
    process.env.WIDGET_MEDIA_URL ??
    '';

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://widgets.api-sports.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://widgets.api-sports.io" />
        <JsonLd data={[buildWebSiteSchema(), buildOrganizationSchema()]} />
        <Script id="sb-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('sb-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}`}
        </Script>
      </head>
      <body style={{ background: 'var(--t-page-bg)', color: 'var(--t-text-2)', margin: 0, padding: 0 }} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <WidgetsProvider
              widgetKey={widgetKey}
              widgetFootballUrl={widgetFootballUrl}
              widgetMediaUrl={widgetMediaUrl}
            >
              <AppShell>{children}</AppShell>
            </WidgetsProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
