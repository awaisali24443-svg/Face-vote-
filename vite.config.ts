import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import express from 'express';
import apiRouter from './server/api.ts';

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const apiApp = express();
      apiApp.use(express.json({ limit: '10mb' }));
      apiApp.use('/api', apiRouter);
      server.middlewares.use(apiApp);
    },
  };
}

const base = process.env.VITE_BASE || '/';
const withBase = (filePath: string) => `${base.replace(/\/?$/, '/')}${filePath}`;

export default defineConfig(() => {
  return {
    // Base path: '/' for the full server deployment (Render/local).
    // GitHub Pages serves this repo under /Face-vote-/ — the Pages workflow
    // builds with VITE_BASE=/Face-vote-/ so asset URLs resolve there.
    base,
    plugins: [
      react(),
      tailwindcss(),
      expressApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon.svg', 'face-api.min.js'],
        manifest: {
          id: base,
          name: 'FaceVote — Biometric Election Kiosk',
          short_name: 'FaceVote',
          description: 'Install FaceVote and use the prepared voting kiosk on this device, even when the connection drops.',
          theme_color: '#064e3b',
          background_color: '#022c22',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'any',
          categories: ['utilities', 'government'],
          start_url: base,
          scope: base,
          icons: [
            {
              src: withBase('pwa-192x192.png'),
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: withBase('pwa-512x512.png'),
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: withBase('pwa-maskable-512x512.png'),
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Pre-cache the complete app shell AND the face-recognition model
          // files. The model shards have no file extension, so `models/*` is
          // required — without it the installed app opened offline but face
          // verification could not load its models.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json,bin}', 'models/*'],
          // SSD MobileNet is included in the public folder but is not one of
          // the three networks this app loads, so do not make every phone
          // download it for offline use.
          globIgnores: ['models/ssd_mobilenetv1_model*'],
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api\//],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'unsplash-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
