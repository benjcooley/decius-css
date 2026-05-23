import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(repoRoot, 'site', 'src', 'app');     // docs content
const reactDir = resolve(repoRoot, 'react');                 // React component layer
const distDir = resolve(repoRoot, 'dist');
const dlDir = resolve(repoRoot, 'site', 'public', 'dl');

// Mirror the built dist/ under the site's public/dl so the docs can serve the
// raw artifacts (download buttons, direct links) in both dev and the build.
function syncDownloads() {
  if (!existsSync(distDir)) return;
  rmSync(dlDir, { recursive: true, force: true });
  cpSync(distDir, dlDir, { recursive: true });
}

// Two layers, one compiled module:
//   react/  — the reusable React component library (icons, components)
//   site/src/app/ — the docs content (tweaks panel, sections, app shell)
// Both are authored as classic shared-scope scripts (read global React, export
// via Object.assign(window, …)); we concatenate them in dependency order so
// Vite/React compiles one module — no per-file ESM refactor needed.
const LIB_ORDER = ['icons', 'components'];               // from react/
const DOCS_ORDER = [
  'tweaks-panel',
  'sections-foundations', 'sections-components', 'sections-layout',
  'sections-data', 'sections-feedback', 'sections-overlays', 'sections-editors',
  'sections-apps', 'sections-skeuomorphic', 'sections-intro',
  'app',
];

function generateEntry() {
  const header =
    "import React from 'react';\n" +
    "import { createRoot } from 'react-dom/client';\n\n";
  const part = (dir, n) => `/* ===== ${n}.jsx ===== */\n` + readFileSync(resolve(dir, `${n}.jsx`), 'utf8');
  const body = [
    ...LIB_ORDER.map((n) => part(reactDir, n)),
    ...DOCS_ORDER.map((n) => part(appDir, n)),
  ].join('\n\n');
  writeFileSync(resolve(appDir, '..', 'app.gen.jsx'), header + body);
}

function deciusEntryPlugin() {
  return {
    name: 'decius-site-entry',
    buildStart() { generateEntry(); syncDownloads(); },
    configureServer(server) {
      server.watcher.add(appDir);
      server.watcher.add(reactDir);
      server.watcher.on('change', (file) => {
        const f = file.replace(/\\/g, '/');
        if (f.includes('/site/src/app/') || f.includes('/react/')) {
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
