import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Personal OS',
        short_name: 'Personal OS',
        description: 'Your personal operating system for thoughts, tasks, and knowledge.',
        theme_color: '#f6f2ea',
        background_color: '#f6f2ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }: { request: Request }) =>
              request.mode === 'navigate',
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\.(?:js|css|png|woff2|svg)$/,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query':   ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'vendor-ui':      [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-visually-hidden',
            'framer-motion',
          ],
          'vendor-editor':  [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/lang-markdown',
            '@codemirror/search',
            '@codemirror/autocomplete',
          ],
          'vendor-utils':   ['fflate', 'uuid', 'nanoid', 'zod', 'yaml'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
