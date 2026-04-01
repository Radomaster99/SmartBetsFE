import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { WidgetsProvider } from '@/components/widgets/WidgetsProvider';

export const metadata: Metadata = {
  title: 'SmartBets — Odds Monitor',
  description: 'Football odds monitoring dashboard',
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
      <body style={{ background: 'var(--t-page-bg)', color: 'var(--t-text-2)', margin: 0, padding: 0 }}>
        <QueryProvider>
          <ThemeProvider>
            <WidgetsProvider widgetKey={widgetKey}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Topbar />
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  <Sidebar />
                  <main style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                  </main>
                </div>
              </div>
            </WidgetsProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
