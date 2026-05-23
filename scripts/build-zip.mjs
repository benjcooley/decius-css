#!/usr/bin/env node
// Bundle the distributable artifacts (css + js + fonts) into a single
// downloadable archive: dist/decius-css.zip. Source maps are excluded.
import AdmZip from 'adm-zip';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import { root, sizeKB } from './lib.mjs';

const dist = resolve(root, 'dist');
const noMaps = (entry) => !entry.endsWith('.map');

const zip = new AdmZip();
zip.addLocalFolder(resolve(dist, 'css'), 'decius-css/css', noMaps);
zip.addLocalFolder(resolve(dist, 'js'), 'decius-css/js', noMaps);
zip.addLocalFolder(resolve(dist, 'fonts'), 'decius-css/fonts');
zip.addLocalFile(resolve(root, 'LICENSE'), 'decius-css');
zip.addLocalFile(resolve(root, 'README.md'), 'decius-css');

const out = resolve(dist, 'decius-css.zip');
zip.writeZip(out);
console.log(`  zip  decius-css.zip   ${(statSync(out).size / 1024).toFixed(0)} kB`);
