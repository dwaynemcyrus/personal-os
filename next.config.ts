import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache';

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === 'navigate' ||
        request.headers.get('accept')?.includes('text/html') === true,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    ...runtimeCaching,
  ],
  additionalManifestEntries: [
    { url: '/', revision: null },
    { url: '/strategy', revision: null },
    { url: '/knowledge', revision: null },
    { url: '/execution', revision: null },
    { url: '/offline', revision: null },
  ],
  fallbacks: {
    document: '/offline',
  },
})(config);
