// Shared helpers for the build scripts.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
export const version = pkg.version;

/** A license banner kept in built artifacts (cssnano preserves /*! comments). */
export const banner =
  `/*! decius-css v${version} | MIT License | https://github.com/benjcooley/decius-css */\n`;

export const sizeKB = (str) => (Buffer.byteLength(str, 'utf8') / 1024).toFixed(1) + ' kB';
