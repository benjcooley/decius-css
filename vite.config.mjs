import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(repoRoot, 'site', 'src', 'app');

// The docs app is authored as classic shared-scope scripts (each file reads
// global React/peers and exports via Object.assign(window, …)). We preserve
// that model by concatenating them, in dependency order, into one module that
// Vite/React compiles — no per-file ESM refactor needed.
const APP_ORDER = [
  'icons', 'dcs', 'tweaks-panel',
  'sections-foundations', 'sections-components', 'sections-layout',
  'sections-data', 'sections-feedback', 'sections-editors',
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
    buildStart() { generateEntry(); },
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
