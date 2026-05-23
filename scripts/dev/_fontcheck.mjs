// Dev-only: render glyphs from the built TTF, fitting each by its own bbox so
// the harness can't mis-position them — an honest view of the font geometry.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { root } from '../lib.mjs';

const buf = readFileSync(resolve(root, 'dist/fonts/decius-icons.ttf'));
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const cp = JSON.parse(readFileSync(resolve(root, 'dist/fonts/decius-icons.json'), 'utf8'));

const names = ['cube', 'sphere', 'torus', 'cog', 'record', 'heart', 'star', 'alert',
  'wave-sine', 'folder-open', 'camera', 'magnet', 'curve', 'piano', 'eye', 'droplet',
  'rocket', 'cpu', 'check-circle', 'brush', 'play', 'lock', 'palette', 'layers',
  'wave-square', 'filter-lp', 'align-c-h', 'distribute-h', 'more-h', 'volume'];

const cell = 52, pad = 8, cols = 10, box = 38;
const rows = Math.ceil(names.length / cols);
const w = cols * cell + (cols + 1) * pad;
const h = rows * (cell + 12) + pad;
let body = '';
names.forEach((n, i) => {
  const r = Math.floor(i / cols), c = i % cols;
  const ox = pad + c * (cell + pad), oy = pad + r * (cell + 12);
  const glyph = font.charToGlyph(String.fromCodePoint(parseInt(cp[n], 16)));
  const p = glyph.getPath(0, 0, font.unitsPerEm); // 1 unit = 1 font unit
  const b = glyph.getBoundingBox();
  const gw = b.x2 - b.x1, gh = b.y2 - b.y1;
  const s = box / Math.max(gw, gh, 1);
  const tx = ox + (cell - gw * s) / 2 - b.x1 * s;
  const ty = oy + (cell - gh * s) / 2 - b.y1 * s;
  body += `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})" fill="#111">${p.toSVG()}</g>`;
  body += `<text x="${ox + cell / 2}" y="${oy + cell + 9}" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#777">${n}</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
await sharp(Buffer.from(svg)).png().toFile(resolve(root, '.cache/_fontcheck.png'));
console.log('wrote .cache/_fontcheck.png', w, 'x', h);
