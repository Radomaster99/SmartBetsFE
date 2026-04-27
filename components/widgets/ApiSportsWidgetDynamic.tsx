'use client';
import dynamic from 'next/dynamic';

export const ApiSportsWidgetDynamic = dynamic(
  () => import('./ApiSportsWidget').then((m) => ({ default: m.ApiSportsWidget })),
  { ssr: false },
);
