#!/usr/bin/env node
// Bundle the vanilla component runtime to dist/js:
//   decius.js       IIFE, global `decius`, auto-inits in the browser
//   decius.min.js   minified IIFE
//   decius.esm.js   ES module (named + default exports)
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import { root, banner } from './lib.mjs';

const entry = resolve(root, 'js', 'src', 'decius.js');
const outDir = resolve(root, 'dist', 'js');
// IIFE with globalName exposes the module namespace; flatten so `window.decius`
// is the API object (its default export) rather than the namespace.
const flatten = { js: 'if(typeof decius!=="undefined"&&decius.default)decius=decius.default;' };

const common = { entryPoints: [entry], bundle: true, banner: { js: banner.trim() }, logLevel: 'warning' };

await build({ ...common, outfile: resolve(outDir, 'decius.js'), format: 'iife', globalName: 'decius', footer: flatten });
await build({ ...common, outfile: resolve(outDir, 'decius.min.js'), format: 'iife', globalName: 'decius', footer: flatten, minify: true });
await build({ ...common, outfile: resolve(outDir, 'decius.esm.js'), format: 'esm' });

const kb = (f) => (statSync(resolve(outDir, f)).size / 1024).toFixed(1) + ' kB';
console.log(`  js   decius.js       ${kb('decius.js')}`);
console.log(`  js   decius.min.js   ${kb('decius.min.js')}`);
console.log(`  js   decius.esm.js   ${kb('decius.esm.js')}`);
