#!/usr/bin/env node
// Compile the SCSS entries to dist/css with autoprefixed expanded + minified
// builds and source maps. Dart Sass for compilation, PostCSS for prefixing
// and cssnano for minification.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { root, banner, sizeKB } from './lib.mjs';

const scssDir = resolve(root, 'scss');
const outDir = resolve(root, 'dist', 'css');
mkdirSync(outDir, { recursive: true });

const entries = [
  { in: 'decius.scss', out: 'decius' },
  { in: 'decius-web.scss', out: 'decius-web' },
];

for (const e of entries) {
  const entry = resolve(scssDir, e.in);
  const compiled = sass.compile(entry, {
    style: 'expanded',
    loadPaths: [scssDir],
    sourceMap: true,
    sourceMapIncludeSources: true,
  });

  // Expanded, autoprefixed
  const expanded = await postcss([autoprefixer]).process(compiled.css, {
    from: entry,
    to: resolve(outDir, `${e.out}.css`),
    map: { prev: compiled.sourceMap, inline: false },
  });
  writeFileSync(resolve(outDir, `${e.out}.css`), banner + expanded.css + `\n/*# sourceMappingURL=${e.out}.css.map */\n`);
  writeFileSync(resolve(outDir, `${e.out}.css.map`), expanded.map.toString());

  // Minified
  const minified = await postcss([autoprefixer, cssnano({ preset: 'default' })]).process(compiled.css, {
    from: entry,
    to: resolve(outDir, `${e.out}.min.css`),
    map: { prev: compiled.sourceMap, inline: false },
  });
  writeFileSync(resolve(outDir, `${e.out}.min.css`), banner + minified.css + `\n/*# sourceMappingURL=${e.out}.min.css.map */`);
  writeFileSync(resolve(outDir, `${e.out}.min.css.map`), minified.map.toString());

  console.log(`  css  ${e.out}.css      ${sizeKB(expanded.css)}`);
  console.log(`  css  ${e.out}.min.css  ${sizeKB(minified.css)}`);
}
