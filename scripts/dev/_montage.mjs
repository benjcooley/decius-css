// Dev-only: render an original-stroke vs outlined-fill comparison montage.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { root } from '../lib.mjs';

const names = ['cube', 'sphere', 'torus', 'cog', 'record', 'heart', 'star', 'alert',
  'wave-sine', 'folder-open', 'camera', 'magnet', 'curve', 'piano', 'eye', 'droplet',
  'rocket', 'cpu', 'check-circle', 'brush'];
const cell = 48, pad = 6, cols = 4;
const perRow = cols; // each entry = 2 cells (orig, outlined)
const rows = Math.ceil(names.length / perRow);
const w = perRow * cell * 2 + (perRow + 1) * pad;
const h = rows * (cell + 14) + pad;

const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
let body = '';
names.forEach((n, i) => {
  const r = Math.floor(i / perRow), c = i % perRow;
  const x = pad + c * (cell * 2 + pad);
  const y = pad + r * (cell + 14);
  const orig = inner(readFileSync(resolve(root, 'icons/svg', `${n}.svg`), 'utf8'));
  const out = inner(readFileSync(resolve(root, '.cache/icons-outlined', `${n}.svg`), 'utf8'));
  const scale = cell / 24;
  body += `<g transform="translate(${x},${y}) scale(${scale})" fill="none" stroke="#111" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${orig}</g>`;
  body += `<g transform="translate(${x + cell},${y}) scale(${scale})">${out}</g>`;
  body += `<text x="${x + cell}" y="${y + cell + 11}" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#666">${n}</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
writeFileSync(resolve(root, '.cache/_montage.svg'), svg);
await sharp(Buffer.from(svg)).png().toFile(resolve(root, '.cache/_montage.png'));
console.log('wrote .cache/_montage.png', w, 'x', h);
