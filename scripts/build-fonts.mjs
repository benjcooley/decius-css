#!/usr/bin/env node
// Copy the vendored self-hosted text webfonts into dist/fonts and emit
// dist/css/decius-fonts.css (@font-face for IBM Plex Sans + JetBrains Mono).
import { copyFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, banner, sizeKB } from './lib.mjs';

const fontsDir = resolve(root, 'fonts');
const outFonts = resolve(root, 'dist', 'fonts');
const outCss = resolve(root, 'dist', 'css');
mkdirSync(outFonts, { recursive: true });
mkdirSync(outCss, { recursive: true });

// Standard Google Fonts subset ranges (Fontsource files are split to match).
const RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

const FAMILIES = [
  { pkg: 'ibm-plex-sans', family: 'IBM Plex Sans', weights: [400, 500, 600] },
  { pkg: 'jetbrains-mono', family: 'JetBrains Mono', weights: [400, 500] },
];
const SUBSETS = ['latin', 'latin-ext'];

let css = `${banner}/* decius self-hosted text webfonts — IBM Plex Sans + JetBrains Mono (SIL OFL 1.1) */\n`;
let bytes = 0;

for (const { pkg, family, weights } of FAMILIES) {
  for (const w of weights) {
    for (const s of SUBSETS) {
      for (const ext of ['woff2', 'woff']) {
        const file = `${pkg}-${s}-${w}-normal.${ext}`;
        copyFileSync(resolve(fontsDir, pkg, file), resolve(outFonts, file));
        if (ext === 'woff2') bytes += statSync(resolve(outFonts, file)).size;
      }
      css +=
        `@font-face {\n` +
        `  font-family: "${family}";\n` +
        `  font-style: normal;\n` +
        `  font-weight: ${w};\n` +
        `  font-display: swap;\n` +
        `  src: url("../fonts/${pkg}-${s}-${w}-normal.woff2") format("woff2"),\n` +
        `       url("../fonts/${pkg}-${s}-${w}-normal.woff") format("woff");\n` +
        `  unicode-range: ${RANGES[s]};\n` +
        `}\n`;
    }
  }
}

writeFileSync(resolve(outCss, 'decius-fonts.css'), css);
console.log(`  fonts copied to dist/fonts  (${(bytes / 1024).toFixed(0)} kB woff2)`);
console.log(`  css  decius-fonts.css       ${sizeKB(css)}`);
