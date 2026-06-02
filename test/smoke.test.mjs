#!/usr/bin/env node
// Build smoke test: assert the produced artifacts exist and contain what
// consumers depend on. CSS checks always run; icon-font and text-font checks
// run only when those artifacts are present (i.e. after a full `npm run build`).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = (f) => readFileSync(resolve(root, 'dist/css', f), 'utf8');
const exists = (f) => existsSync(resolve(root, f));
const size = (f) => statSync(resolve(root, f)).size;

let passed = 0;
const check = (name, fn) => {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

// ---- core framework css -------------------------------------------------
check('decius.css built & banner present', () => {
  const c = css('decius.css');
  assert.match(c, /^\/\*! decius-css v/);
  assert.match(c, /--dcs-accent:/);
  assert.match(c, /\.dcs-btn/);
  assert.match(c, /\[data-dcs-style="3d"\]/);
});
check('decius.min.css is smaller than decius.css', () => {
  assert.ok(size('dist/css/decius.min.css') < size('dist/css/decius.css'));
});
check('decius-web.css built', () => {
  assert.match(css('decius-web.css'), /--dw-/);
});

// ---- icon manifest ------------------------------------------------------
check('icons.json lists 225 icons', () => {
  const m = JSON.parse(readFileSync(resolve(root, 'icons/icons.json'), 'utf8'));
  assert.equal(m.icons.length, 225);
  assert.ok(m.icons.includes('cube'));
});

// ---- icon font (after full build) --------------------------------------
if (exists('dist/css/decius-icons.css')) {
  check('icon font css + woff2 present', () => {
    const c = css('decius-icons.css');
    assert.match(c, /@font-face/);
    assert.match(c, /font-family:\s*"decius-icons"/);
    assert.match(c, /\.di-cube::before/);
    assert.ok(exists('dist/fonts/decius-icons.woff2'));
    assert.ok(size('dist/fonts/decius-icons.woff2') > 5000);
  });
}

// ---- self-hosted text fonts (after full build) -------------------------
if (exists('dist/css/decius-fonts.css')) {
  check('text fonts css + woff2 present', () => {
    const c = css('decius-fonts.css');
    assert.match(c, /font-family:\s*"IBM Plex Sans"/);
    assert.match(c, /font-family:\s*"JetBrains Mono"/);
    assert.match(c, /unicode-range:/);
    assert.ok(exists('dist/fonts/ibm-plex-sans-latin-400-normal.woff2'));
    assert.ok(exists('dist/fonts/jetbrains-mono-latin-400-normal.woff2'));
  });
}

// ---- vanilla js runtime (after full build) -----------------------------
if (exists('dist/js/decius.min.js')) {
  check('js runtime built (iife + esm) with components', () => {
    const j = readFileSync(resolve(root, 'dist/js/decius.js'), 'utf8');
    assert.match(j, /decius/);
    assert.match(j, /toast/);
    assert.ok(exists('dist/js/decius.esm.js'));
    assert.ok(size('dist/js/decius.min.js') < size('dist/js/decius.js'));
  });
}

// ---- new components in css ---------------------------------------------
check('css includes menu, popover, toast components', () => {
  const c = css('decius.css');
  assert.match(c, /\.dcs-menu/);
  assert.match(c, /\.dcs-popover/);
  assert.match(c, /\.dcs-toast/);
});
check('accent-filled selections use contrast foreground token', () => {
  const c = css('decius.css');
  assert.match(c, /--dcs-accent-text:\s*#05070d/);
  assert.match(c, /\.dcs-btn--primary\s*\{[^}]*color:\s*var\(--dcs-accent-text\)/s);
  assert.match(c, /\.dcs-menu__item:hover,\s*\.dcs-menu__item--active\s*\{[^}]*color:\s*var\(--dcs-accent-text\)/s);
  assert.match(c, /\.dcs-check\[aria-checked=(?:"true"|true)\]\s+\.dcs-check__box\s*\{[^}]*color:\s*var\(--dcs-accent-text\)/s);
});
check('select dropdown menus can stretch wider than command menus', () => {
  const c = css('decius.css');
  assert.match(c, /\.dcs-menu\s*\{[^}]*max-width:\s*320px/s);
  assert.match(c, /\.dcs-menu--select\s*\{[^}]*max-width:\s*none/s);
  assert.match(c, /\.dcs-menu--select\s+\.dcs-menu__item\s*\{[^}]*width:\s*100%/s);
});

// ---- download archive (after full build) -------------------------------
if (exists('dist/decius-css.zip')) {
  check('decius-css.zip archive present', () => {
    assert.ok(size('dist/decius-css.zip') > 50000);
  });
}

// ---- bundle (after full build) -----------------------------------------
if (exists('dist/css/decius.bundle.css')) {
  check('bundle contains fonts + icons + core', () => {
    const c = css('decius.bundle.css');
    assert.match(c, /IBM Plex Sans/);
    assert.match(c, /decius-icons/);
    assert.match(c, /\.dcs-btn/);
  });
}

console.log(`\n${passed} checks passed${process.exitCode ? ', with failures' : ''}.`);
