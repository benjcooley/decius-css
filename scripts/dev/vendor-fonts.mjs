#!/usr/bin/env node
/**
 * vendor-fonts.mjs — copy the self-hosted text webfonts from their Fontsource
 * packages into fonts/ (committed source of truth), with OFL licenses. Re-run
 * after bumping @fontsource/* to refresh the vendored woff2/woff files.
 *
 * Both families are licensed under the SIL Open Font License 1.1.
 */
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../lib.mjs';

const FAMILIES = [
  { pkg: 'ibm-plex-sans', weights: [400, 500, 600] },
  { pkg: 'jetbrains-mono', weights: [400, 500] },
];
const SUBSETS = ['latin', 'latin-ext'];

for (const { pkg, weights } of FAMILIES) {
  const src = resolve(root, 'node_modules', '@fontsource', pkg);
  const dst = resolve(root, 'fonts', pkg);
  mkdirSync(dst, { recursive: true });
  for (const w of weights) {
    for (const s of SUBSETS) {
      for (const ext of ['woff2', 'woff']) {
        const file = `${pkg}-${s}-${w}-normal.${ext}`;
        copyFileSync(resolve(src, 'files', file), resolve(dst, file));
      }
    }
  }
  copyFileSync(resolve(src, 'LICENSE'), resolve(dst, 'OFL.txt'));
  const meta = JSON.parse(readFileSync(resolve(src, 'package.json'), 'utf8'));
  writeFileSync(resolve(dst, 'VERSION'), `@fontsource/${pkg} ${meta.version}\nSIL Open Font License 1.1 — see OFL.txt\n`);
  console.log(`vendored ${pkg} (weights ${weights.join(',')}, subsets ${SUBSETS.join(',')})`);
}
