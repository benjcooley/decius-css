import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(repoRoot, 'site', 'src', 'app');
const distDir = resolve(repoRoot, 'dist');
const dlDir = resolve(repoRoot, 'site', 'public', 'dl');

// Mirror the built dist/ under the site's public/dl so the docs can serve the
// raw artifacts (download buttons, direct links) in both dev and the build.
function syncDownloads() {
  if (!existsSync(distDir)) return;
  rmSync(dlDir, { recursive: true, force: true });
  cpSync(distDir, dlDir, { recursive: true });
}

// The docs app is authored as classic shared-scope scripts (each file reads
// global React/peers and exports via Object.assign(window, …)). We preserve
// that model by concatenating them, in dependency order, into one module that
// Vite/React compiles — no per-file ESM refactor needed.
const APP_ORDER = [
  'icons', 'dcs', 'tweaks-panel',
  'sections-foundations', 'sections-components', 'sections-layout',
  'sections-data', 'sections-feedback', 'sections-overlays', 'sections-editors',
  'sections-apps', 'sections-skeuomorphic', 'sections-intro',
  'app',
];

function generateEntry() {
  const header =
    "import React from 'react';\n" +
    "import { createRoot } from 'react-dom/client';\n\n";
  const body = APP_ORDER
    .map((n) => `/* ===== ${n}.jsx ===== */\n` + readFileSync(resolve(appDir, `${n}.jsx`), 'utf8'))
    .join('\n\n');
  writeFileSync(resolve(appDir, '..', 'app.gen.jsx'), header + body);
}

function deciusEntryPlugin() {
  return {
    name: 'decius-site-entry',
    buildStart() { generateEntry(); syncDownloads(); },
    configureServer(server) {
      server.watcher.add(appDir);
      server.watcher.on('change', (file) => {
        if (file.replace(/\\/g, '/').includes('/site/src/app/')) {
          generateEntry();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

generateEntry(); // ensure the generated entry exists before resolution
syncDownloads();

export default defineConfig({
  root: resolve(repoRoot, 'site'),
  base: '/decius-css/',
  plugins: [deciusEntryPlugin(), react()],
  build: {
    outDir: resolve(repoRoot, '_site'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
