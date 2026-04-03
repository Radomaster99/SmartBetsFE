import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { WidgetsProvider } from '@/components/widgets/WidgetsProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SmartBets - Football Odds Monitor',
  description: 'Football odds comparison and live market tracking for serious bettors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const widgetKey =
    process.env.NEXT_PUBLIC_WIDGET_KEY ??
    process.env.WIDGET_KEY ??
    process.env.NEXT_PUBLIC_API_SPORTS_WIDGET_KEY ??
    process.env.API_SPORTS_WIDGET_KEY ??
    '';

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="sb-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('sb-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}`}
        </Script>
      </head>
      <body style={{ background: 'var(--t-page-bg)', color: 'var(--t-text-2)', margin: 0, padding: 0 }} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <WidgetsProvider widgetKey={widgetKey}>
              <AppShell>{children}</AppShell>
            </WidgetsProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
