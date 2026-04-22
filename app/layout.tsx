import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { WidgetsProvider } from '@/components/widgets/WidgetsProvider';
import { AppShell } from '@/components/layout/AppShell';
import { getSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'OddsDetector - Football Odds Monitor',
    template: '%s | OddsDetector',
  },
  description: 'Compare football odds across bookmakers, track live markets, and find the best prices on OddsDetector.',
  icons: {
    icon: '/icon',
    shortcut: '/icon',
    apple: '/apple-icon',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${getSiteUrl()}/#website`,
              name: 'OddsDetector',
              url: getSiteUrl(),
              description: 'Football odds comparison and live market tracking',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${getSiteUrl()}/?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': `${getSiteUrl()}/#organization`,
              name: 'OddsDetector',
              url: getSiteUrl(),
              logo: {
                '@type': 'ImageObject',
                url: `${getSiteUrl()}/icon`,
              },
              sameAs: [],
            }),
          }}
        />
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
