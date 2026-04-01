import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { WidgetConfig } from '@/components/widgets/WidgetConfig';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export const metadata: Metadata = {
  title: 'SmartBets — Odds Monitor',
  description: 'Football odds monitoring dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('sb-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}` }} />
        {/* API-Sports widget library — loaded once for entire app */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js" />
      </head>
      <body style={{ background: 'var(--t-page-bg)', color: 'var(--t-text-2)', margin: 0, padding: 0 }}>
        <QueryProvider>
          <ThemeProvider>
            <WidgetConfig />
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
              <Topbar />
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
