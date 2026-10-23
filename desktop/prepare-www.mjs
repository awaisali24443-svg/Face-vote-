// ============================================================
// prepare-www.mjs — build the bundle the desktop app serves.
//
// Copies the web app's production build (../dist) into ./www,
// applies the same packaging used for the Android app:
//   - relative asset paths (no web-server root assumptions)
//   - service-worker / PWA-manifest wiring removed (the desktop
//     shell serves the files itself; data lives in the app
//     profile, so no service worker is needed)
//   - the unused SSD face model is dropped (the app only loads
//     TinyFaceDetector + Landmarks + Recognition)
// Also copies the app icon next to main.js for the window icon.
//
// Run `npm run build` in the repo root first so ../dist exists.
// ============================================================

import { cpSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');
const wwwDir = join(here, 'www');

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('Missing ../dist — run `npm run build` in the repo root first.');
  process.exit(1);
}

rmSync(wwwDir, { recursive: true, force: true });
cpSync(distDir, wwwDir, { recursive: true });

// Drop PWA service-worker files (not used inside the desktop shell).
for (const name of readdirSync(wwwDir)) {
  if (name === 'sw.js' || name.startsWith('workbox-') || name === 'registerSW.js' || name === 'manifest.webmanifest') {
    rmSync(join(wwwDir, name), { force: true });
  }
}

// Drop the SSD model the app never loads.
const modelsDir = join(wwwDir, 'models');
if (existsSync(modelsDir)) {
  for (const name of readdirSync(modelsDir)) {
    if (name.startsWith('ssd_mobilenetv1')) rmSync(join(modelsDir, name), { force: true });
  }
}

// Patch index.html: relative assets + no SW registration.
const indexPath = join(wwwDir, 'index.html');
let html = readFileSync(indexPath, 'utf8');
html = html.replaceAll('src="/assets/', 'src="./assets/').replaceAll('href="/assets/', 'href="./assets/');
html = html.replace('<link rel="manifest" href="/manifest.webmanifest"><script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script>', '');
writeFileSync(indexPath, html);

// Window/taskbar icon for the shell.
const iconSrc = join(here, '..', 'public', 'pwa-512x512.png');
if (existsSync(iconSrc)) cpSync(iconSrc, join(here, 'icon.png'));

console.log('www bundle prepared:', wwwDir);
