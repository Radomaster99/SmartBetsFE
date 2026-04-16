'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAdminSession } from '@/lib/hooks/useAdminSession';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function AdminRouteGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionQuery = useAdminSession(true);

  useEffect(() => {
    if (sessionQuery.isLoading) {
      return;
    }

    if (!sessionQuery.data) {
      const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }
  }, [pathname, router, searchParams, sessionQuery.data, sessionQuery.isLoading]);

  if (sessionQuery.isLoading || !sessionQuery.data) {
    return (
      <div className="p-5">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
