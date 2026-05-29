import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync, cpSync, rmSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(repoRoot, 'site', 'src', 'app');     // docs content
const reactDir = resolve(repoRoot, 'react');                 // React component layer
const distDir = resolve(repoRoot, 'dist');
const dlDir = resolve(repoRoot, 'site', 'public', 'dl');
const samplesDir = resolve(repoRoot, 'samples');
const publicDir = resolve(repoRoot, 'site', 'public');

// Each entry: source folder name (under samples/) → published URL slug (under site/public/).
// Updating this drives both the build copy and the URLs the main page links to.
const SAMPLE_APPS = [
  { src: 'dender',        slug: 'dender' },
  { src: 'decius-photo',  slug: 'photoedit' },
];

// Mirror the built dist/ under the site's public/dl so the docs can serve the
// raw artifacts (download buttons, direct links) in both dev and the build.
function syncDownloads() {
  if (!existsSync(distDir)) return;
  rmSync(dlDir, { recursive: true, force: true });
  cpSync(distDir, dlDir, { recursive: true });
}

// Copy each sample app from samples/<src>/ to site/public/<slug>/ so the
// dev server and the production build both expose them at /<slug>/. The
// in-repo samples reference the framework via `../../dist/...`; under the
// site root those paths would resolve OUTSIDE site/, so we rewrite every
// `../../dist/` (and `../../../dist/`, defensively) to `../dl/` in the
// copied HTML — `dl/` is the same dist mirror created by syncDownloads().
function syncSamples() {
  if (!existsSync(samplesDir)) return;
  const rewrite = (file) => {
    if (!/\.html?$/i.test(file)) return;
    const txt = readFileSync(file, 'utf8');
    const rewritten = txt
      .replaceAll('../../../dist/', '../dl/')
      .replaceAll('../../dist/', '../dl/');
    if (rewritten !== txt) writeFileSync(file, rewritten);
  };
  const walk = (root) => {
    for (const name of readdirSync(root)) {
      const p = join(root, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else rewrite(p);
    }
  };
  for (const { src, slug } of SAMPLE_APPS) {
    const from = join(samplesDir, src);
    const to = join(publicDir, slug);
    if (!existsSync(from)) continue;
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    walk(to);
  }
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
    buildStart() { generateEntry(); syncDownloads(); syncSamples(); },
    configureServer(server) {
      server.watcher.add(appDir);
      server.watcher.add(reactDir);
      server.watcher.add(samplesDir);
      server.watcher.on('change', (file) => {
        const f = file.replace(/\\/g, '/');
        if (f.includes('/site/src/app/') || f.includes('/react/')) {
          generateEntry();
          server.ws.send({ type: 'full-reload' });
        } else if (f.includes('/samples/')) {
          syncSamples();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

generateEntry(); // ensure the generated entry exists before resolution
syncDownloads();
syncSamples();

export default defineConfig({
  root: resolve(repoRoot, 'site'),
  base: '/',
  plugins: [deciusEntryPlugin(), react()],
  build: {
    outDir: resolve(repoRoot, '_site'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
