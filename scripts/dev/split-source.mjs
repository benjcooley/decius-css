#!/usr/bin/env node
/**
 * split-source.mjs — one-time / regenerable provenance tool.
 *
 * Carves the original hand-authored CSS from the Claude Design deliverable
 * (design/_extracted/styles/*.css) into Bootstrap-style SCSS partials under
 * scss/core and scss/web, splitting only at the original section banners so
 * the byte content of each rule is preserved exactly. SCSS is a superset of
 * CSS, so these partials compile back to equivalent CSS via Dart Sass.
 *
 * The generated partials are the committed source of truth; this script just
 * documents how they were derived and lets us re-derive them if the design
 * deliverable is updated. Run: `node scripts/dev/split-source.mjs`.
 *
 * KNOWN MANUAL REPAIRS (re-apply if you regenerate): the original decius.css
 * contains two orphaned comment tails in the skeuomorphic section (a banner
 * lost its opening `/*` during export) — browsers swallow them via CSS error
 * recovery, but Sass rejects them. After regenerating, restore the `/*`
 * openings on the "Hardware chassis" and "Skeuomorphic card" banners in
 * scss/core/_23-skeuomorphic-hardware-elements.scss.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const srcDir = resolve(root, 'design', '_extracted', 'styles');

const slugify = (s) =>
  s
    .split('—')[0]              // drop trailing prose after an em dash
    .trim()
    .toLowerCase()
    .replace(/["'\[\]]/g, '')   // strip quotes/brackets
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function writePartial(dir, name, lines) {
  mkdirSync(dir, { recursive: true });
  const body = lines.join('\n').replace(/\s+$/, '') + '\n';
  writeFileSync(resolve(dir, `_${name}.scss`), body, 'utf8');
}

/** Find the index of the comment-open line `/*` at or above `i`. */
function bannerStart(lines, i) {
  for (let j = i; j >= 0; j--) if (lines[j].includes('/*')) return j;
  return i;
}

/* ----------------------------------------------------------------
   core: decius.css — split at numbered `N · TITLE` banners
   ---------------------------------------------------------------- */
function splitCore() {
  const lines = readFileSync(resolve(srcDir, 'decius.css'), 'utf8').split(/\r?\n/);
  const titleRe = /^\s*(\d+)\s+·\s+(.+?)\s*$/;
  const marks = [];
  lines.forEach((l, i) => {
    const m = l.match(titleRe);
    if (m) marks.push({ i, num: +m[1], title: m[2], banner: bannerStart(lines, i) });
  });
  const order = [];
  const preamble = lines.slice(0, marks[0].banner);
  writePartial(resolve(root, 'scss', 'core'), '00-banner', preamble);
  order.push('00-banner');
  marks.forEach((mk, k) => {
    const end = k + 1 < marks.length ? marks[k + 1].banner : lines.length;
    const idx = String(k + 1).padStart(2, '0');
    const name = `${idx}-${slugify(mk.title)}`;
    writePartial(resolve(root, 'scss', 'core'), name, lines.slice(mk.banner, end));
    order.push(name);
  });
  return order;
}

/* ----------------------------------------------------------------
   web: decius-web.css — split at `/* ---- X ---- *​/` banners
   ---------------------------------------------------------------- */
function splitWeb() {
  const lines = readFileSync(resolve(srcDir, 'decius-web.css'), 'utf8').split(/\r?\n/);
  const titleRe = /^\/\*\s*-{3,}\s*(.+?)\s*-{3,}\s*\*\/\s*$/;
  const marks = [];
  lines.forEach((l, i) => {
    const m = l.match(titleRe);
    if (m) marks.push({ i, title: m[1] });
  });
  const order = [];
  // Preamble holds the banner, :root tokens and base/element styles.
  writePartial(resolve(root, 'scss', 'web'), '00-base', lines.slice(0, marks[0].i));
  order.push('00-base');
  marks.forEach((mk, k) => {
    const end = k + 1 < marks.length ? marks[k + 1].i : lines.length;
    const idx = String(k + 1).padStart(2, '0');
    const name = `${idx}-${slugify(mk.title)}`;
    writePartial(resolve(root, 'scss', 'web'), name, lines.slice(mk.i, end));
    order.push(name);
  });
  return order;
}

const core = splitCore();
const web = splitWeb();
console.log('core partials:\n  ' + core.join('\n  '));
console.log('\nweb partials:\n  ' + web.join('\n  '));
