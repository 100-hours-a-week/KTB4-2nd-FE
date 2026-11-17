import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'standalone',
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
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

async function configureNext(phase: string): Promise<NextConfig> {
  if (
    process.env.NEXT_PUBLIC_REALTIME_EXPERIMENT !== 'true' ||
    (phase !== PHASE_PRODUCTION_BUILD && phase !== PHASE_DEVELOPMENT_SERVER)
  ) {
    return nextConfig;
  }

  // Turbopack emits a SharedWorker URL as a raw asset instead of bundling its imports.
  const { build } = await import('esbuild');
  const { outputFiles } = await build({
    entryPoints: [path.join(__dirname, 'src/shared/api/realtime/realtimeShared.worker.ts')],
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    bundle: true,
    minify: phase === PHASE_PRODUCTION_BUILD,
    write: false,
  });
  const worker = outputFiles[0].contents;
  const hash = createHash('sha256').update(worker).digest('hex').slice(0, 16);
  const asset = `realtime-${hash}.js`;
  const directory = path.join(__dirname, 'public', '_realtime-experiment');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, asset), worker);

  return {
    ...nextConfig,
    env: { NEXT_PUBLIC_REALTIME_WORKER_URL: `/_realtime-experiment/${asset}` },
  };
}

export default withSentryConfig(configureNext, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'yeodam-4z',

  project: 'yeodam-frontend',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
