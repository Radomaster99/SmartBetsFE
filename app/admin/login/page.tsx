'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { OddsDetectorLogo } from '@/components/branding/OddsDetectorLogo';
import { ADMIN_SESSION_QUERY_KEY, useAdminSession } from '@/lib/hooks/useAdminSession';

function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/admin')) {
    return '/admin/sync';
  }

  return value;
}

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionQuery = useAdminSession(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    if (sessionQuery.data) {
      router.replace(nextPath);
    }
  }, [nextPath, router, sessionQuery.data]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) {
        setError(payload?.error ?? payload?.message ?? 'Login failed');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY });
      router.replace(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-52px)] items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-md rounded-2xl p-6 md:p-7"
        style={{
          background: 'linear-gradient(180deg, rgba(12,18,31,0.96), rgba(8,12,22,0.98))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <OddsDetectorLogo size={32} showWordmark={false} />
          <div className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--t-accent)' }}>
            OddsDetector Admin
          </div>
        </div>
        <h1 className="mt-3 text-[28px] font-black tracking-[-0.03em]" style={{ color: 'var(--t-text-1)' }}>
          Sign in
        </h1>
        <p className="mt-2 text-[13px] leading-6" style={{ color: 'var(--t-text-4)' }}>
          Use your admin username and password to unlock control panel actions, live refresh tools, and production
          content editing.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
              Username
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="rounded-lg px-3 py-3 text-[14px]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--t-text-1)',
                outline: 'none',
              }}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="rounded-lg px-3 py-3 text-[14px]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--t-text-1)',
                outline: 'none',
              }}
              required
            />
          </label>

          {error ? (
            <div
              className="rounded-lg px-3 py-2 text-[12px]"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.24)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center justify-center rounded-lg px-4 py-3 text-[13px] font-black uppercase tracking-[0.16em]"
            style={{
              background: isSubmitting ? 'rgba(0,230,118,0.18)' : 'linear-gradient(135deg,#00e676,#22c55e)',
              border: '1px solid rgba(0,230,118,0.28)',
              color: '#04140b',
              cursor: isSubmitting ? 'wait' : 'pointer',
              boxShadow: isSubmitting ? 'none' : '0 12px 30px rgba(0,230,118,0.16)',
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
          Need to return to the public site?{' '}
          <Link href="/football" style={{ color: 'var(--t-accent)', textDecoration: 'none' }}>
            Open OddsDetector
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-5">Loading admin login...</div>}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
