import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'media.apifootball.com' },
      { protocol: 'https', hostname: '*.api-sports.io' },
    ],
  },
};

export default nextConfig;
