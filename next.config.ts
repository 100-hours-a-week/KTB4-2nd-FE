import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'http', hostname: '*.kakaocdn.net' },
      { protocol: 'https', hostname: '*.kakao.com' },
    ],
  },
};

export default nextConfig;
