#!/usr/bin/env node
// Concatenate the self-hosted fonts, icon font, and core framework into a
// single drop-in stylesheet: dist/css/decius.bundle.css (+ .min). Relative
// ../fonts/ URLs stay valid because the bundle also lives in dist/css.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { root, banner, sizeKB } from './lib.mjs';

const cssDir = resolve(root, 'dist', 'css');
const read = (f) => readFileSync(resolve(cssDir, f), 'utf8')
  .replace(/^\/\*![^\n]*\*\/\n/, '')                 // drop per-file banner
  .replace(/\n?\/\*# sourceMappingURL=[^*]*\*\/\n?/g, ''); // drop map refs

const parts = ['decius-fonts.css', 'decius-icons.css', 'decius.css'];
const combined = banner + parts.map((p) => `\n/* ===== ${p} ===== */\n` + read(p)).join('\n');
writeFileSync(resolve(cssDir, 'decius.bundle.css'), combined);

const min = await postcss([cssnano({ preset: 'default' })]).process(combined, { from: undefined });
writeFileSync(resolve(cssDir, 'decius.bundle.min.css'), banner + min.css);

console.log(`  css  decius.bundle.css      ${sizeKB(combined)}`);
console.log(`  css  decius.bundle.min.css  ${sizeKB(min.css)}`);
