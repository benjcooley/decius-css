#!/usr/bin/env node
// Build the decius icon web font from the per-icon source SVGs:
//   1. outline strokes -> filled glyphs (Python + Shapely, deterministic)
//   2. svgicons2svgfont -> svg2ttf -> woff2 + woff, with stable PUA codepoints
//   3. emit dist/css/decius-icons.css (@font-face + .di-* classes)
import { mkdirSync, writeFileSync, readFileSync, rmSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2woff2 from 'ttf2woff2';
import ttf2woff from 'ttf2woff';
import { root, banner, sizeKB } from './lib.mjs';

const svgDir = resolve(root, 'icons', 'svg');
const cacheDir = resolve(root, '.cache', 'icons-outlined');
const fontDir = resolve(root, 'dist', 'fonts');
const cssDir = resolve(root, 'dist', 'css');
const manifest = JSON.parse(readFileSync(resolve(root, 'icons', 'icons.json'), 'utf8'));

// 1 · outline strokes to fills --------------------------------------------
// Find a Python 3 with shapely + svgelements (probe so this works across
// pyenv / Windows Store stubs / CI). Override with $PYTHON.
function findPython() {
  for (const c of [process.env.PYTHON, 'python3', 'python', 'py'].filter(Boolean)) {
    if (spawnSync(c, ['-c', 'import shapely, svgelements'], { stdio: 'ignore' }).status === 0) return c;
  }
  return null;
}
const py = findPython();
if (!py) {
  console.error('No Python 3 with shapely + svgelements found.');
  console.error('Install with:  pip install shapely svgelements   (or set $PYTHON)');
  process.exit(1);
}
rmSync(cacheDir, { recursive: true, force: true });
mkdirSync(cacheDir, { recursive: true });
const r = spawnSync(py, [resolve(root, 'scripts', 'outline_icons.py'), svgDir, cacheDir, '1.25'],
  { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);

// 2 · stable codepoints (sorted names -> PUA from U+E000) ------------------
const codepoints = {};
manifest.icons.forEach((name, i) => { codepoints[name] = 0xe000 + i; });

const svgFont = await new Promise((resolveP, rejectP) => {
  const stream = new SVGIcons2SVGFontStream({
    fontName: 'decius-icons',
    fontHeight: 1000,    // all icons share a 24x24 viewBox -> uniform scale
    descent: 150,        // sink glyphs ~15% below baseline so they optically center on text
    normalize: false,    // do NOT per-glyph normalize: it distorts short/wide icons
    centerHorizontally: true,
    log: () => {},
  });
  let out = '';
  stream.on('data', (d) => { out += d; });
  stream.on('end', () => resolveP(out));
  stream.on('error', rejectP);
  for (const name of manifest.icons) {
    const glyph = createReadStream(resolve(cacheDir, `${name}.svg`));
    glyph.metadata = { unicode: [String.fromCodePoint(codepoints[name])], name };
    stream.write(glyph);
  }
  stream.end();
});

const ttf = Buffer.from(svg2ttf(svgFont, { description: 'decius icon font', url: 'https://github.com/benjcooley/decius-css' }).buffer);
const woff2 = ttf2woff2(ttf);
const woff = Buffer.from(ttf2woff(ttf).buffer);

mkdirSync(fontDir, { recursive: true });
writeFileSync(resolve(fontDir, 'decius-icons.ttf'), ttf);
writeFileSync(resolve(fontDir, 'decius-icons.woff2'), woff2);
writeFileSync(resolve(fontDir, 'decius-icons.woff'), woff);
writeFileSync(resolve(fontDir, 'decius-icons.json'),
  JSON.stringify(Object.fromEntries(manifest.icons.map((n) => [n, codepoints[n].toString(16)])), null, 2) + '\n');

// 3 · CSS -----------------------------------------------------------------
const glyphs = manifest.icons
  .map((name) => `.di-${name}::before { content: "\\${codepoints[name].toString(16)}"; }`)
  .join('\n');
const css = `${banner}/* decius icon font — ${manifest.count} icons. Usage: <i class="di-cube"></i> */
@font-face {
  font-family: "decius-icons";
  src: url("../fonts/decius-icons.woff2") format("woff2"),
       url("../fonts/decius-icons.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
.di, [class^="di-"], [class*=" di-"] {
  font-family: "decius-icons" !important;
  font-style: normal;
  font-weight: 400;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  speak: never;
  display: inline-block;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${glyphs}
`;
mkdirSync(cssDir, { recursive: true });
writeFileSync(resolve(cssDir, 'decius-icons.css'), css);

console.log(`  font decius-icons.woff2  ${sizeKB(woff2)}`);
console.log(`  font decius-icons.woff   ${sizeKB(woff)}`);
console.log(`  css  decius-icons.css    ${manifest.count} glyphs, ${sizeKB(css)}`);
