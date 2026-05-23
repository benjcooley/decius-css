#!/usr/bin/env node
/**
 * split-sprite.mjs — provenance / regenerable source tool.
 *
 * Splits the original icon sprite (design/_extracted/icons/decius-icons.svg)
 * into per-icon source SVGs under icons/svg/<name>.svg and writes the icon
 * catalog manifest icons/icons.json. These per-icon SVGs are the SOURCE the
 * icon web font is built from (icons are not shipped as SVG artifacts).
 *
 * Run: `npm run gen:icons`.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sprite = resolve(root, 'design', '_extracted', 'icons', 'decius-icons.svg');
const svgDir = resolve(root, 'icons', 'svg');

// Canonical default stroke style (matches .dcs-icon in the framework).
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"';

// Icon groups, copied from the design app catalog (app/icons.jsx). First group
// a name appears in wins; sprite icons missing here fall into "misc".
const CATALOG = [
  ['File / system', ['file', 'folder', 'folder-open', 'save', 'export', 'import', 'trash', 'cog']],
  ['Edit', ['undo', 'redo', 'cut', 'copy', 'paste', 'edit', 'delete', 'duplicate', 'bug']],
  ['Transform', ['move', 'rotate', 'scale', 'scale-corners', 'pivot', 'pivot-rotate', 'mirror']],
  ['Snap / align / gizmo', ['snap', 'snap-pos', 'snap-rot', 'snap-grid', 'magnet', 'align-l', 'align-c-h', 'align-r', 'align-t', 'align-c-v', 'align-b', 'distribute-h', 'distribute-v', 'gizmo', 'gizmo-off']],
  ['View', ['eye', 'eye-off', 'zoom-in', 'zoom-out', 'fit', 'fullscreen', 'grid-show', 'grid-hide', 'grid-snap']],
  ['View modes', ['view-bbox', 'view-wire', 'view-solid', 'view-lit', 'view-tex', 'view-render']],
  ['Objects', ['cube', 'sphere', 'cylinder', 'plane', 'cone', 'torus', 'mesh', 'light', 'camera', 'bone']],
  ['Tools', ['brush', 'eraser', 'fill', 'pen', 'select', 'lasso', 'marquee']],
  ['UI / nav', ['chevron-right', 'chevron-left', 'chevron-down', 'chevron-up', 'caret-up-down', 'close', 'check', 'plus', 'minus', 'search', 'menu', 'more-h', 'more-v', 'grip', 'grip-h']],
  ['Transport', ['play', 'pause', 'stop', 'record', 'rewind', 'fast-forward', 'skip-back', 'skip-fwd', 'volume', 'mic', 'loop']],
  ['Audio / DAW', ['headphones', 'speaker', 'metronome', 'tempo', 'bars', 'beat', 'sample', 'piano', 'drum', 'midi', 'cable', 'gain', 'eq', 'compress', 'limiter', 'gate', 'sidechain', 'pan', 'stereo', 'mono', 'mute', 'solo', 'arm']],
  ['Waveforms / DSP', ['wave-sine', 'wave-square', 'wave-saw', 'wave-tri', 'wave-noise', 'envelope', 'lfo', 'filter-lp', 'filter-hp', 'filter-bp', 'filter-notch']],
  ['Synth / mod', ['oscillator', 'adsr', 'modulate', 'modwheel', 'pitchbend', 'vibrato', 'portamento', 'voice', 'poly', 'preset', 'arp', 'glide']],
  ['Video editing', ['clip', 'track-v', 'track-a', 'splice', 'blade', 'ripple', 'slip', 'transition', 'fade-in', 'fade-out', 'marker', 'marker-in', 'marker-out', 'filmstrip', 'aspect', 'color-grade', 'keyframe']],
  ['Painting / drawing', ['pencil', 'marker-pen', 'airbrush', 'stamp', 'clone', 'smudge', 'blur', 'sharpen', 'dodge', 'burn', 'sponge', 'tablet-pen', 'opacity', 'flow', 'pressure', 'layer-mask', 'history-brush', 'mixer-brush']],
  ['Outliner', ['layers', 'group', 'ungroup', 'link', 'link-broken', 'lock', 'unlock', 'pin', 'star', 'star-outline', 'heart', 'heart-outline', 'tag']],
  ['Render / shading', ['render', 'wireframe', 'shaded', 'textured', 'normals', 'uv']],
  ['Animation', ['key', 'keys', 'timeline', 'curve', 'graph', 'spline']],
  ['Color / image', ['palette', 'droplet', 'eyedropper', 'image', 'texture']],
  ['Status', ['info', 'alert', 'error', 'check-circle', 'help']],
  ['Misc', ['grid', 'axes', 'globe', 'cpu', 'gpu', 'ai', 'bolt', 'cross-target', 'decimate', 'subdivide', 'extrude', 'array', 'rocket', 'decius']],
];

const groupOf = new Map();
for (const [g, names] of CATALOG) for (const n of names) if (!groupOf.has(n)) groupOf.set(n, g);

const raw = readFileSync(sprite, 'utf8');
const re = /<symbol\s+id="di-([^"]+)"\s+viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g;

rmSync(svgDir, { recursive: true, force: true });
mkdirSync(svgDir, { recursive: true });

const icons = [];
let m;
while ((m = re.exec(raw))) {
  const [, name, viewBox, inner] = m;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${STROKE}>${inner.trim()}</svg>\n`;
  writeFileSync(resolve(svgDir, `${name}.svg`), svg, 'utf8');
  icons.push({ name, group: groupOf.get(name) || 'Misc' });
}
icons.sort((a, b) => a.name.localeCompare(b.name));

// Group view, preserving catalog order, with any extras appended.
const groups = [];
const seen = new Set();
for (const [g] of CATALOG) {
  const list = icons.filter((i) => i.group === g).map((i) => i.name);
  if (list.length) { groups.push({ name: g, icons: list }); list.forEach((n) => seen.add(n)); }
}
const extras = icons.filter((i) => !seen.has(i.name)).map((i) => i.name);
if (extras.length) groups.push({ name: 'Uncategorized', icons: extras });

const manifest = {
  name: 'decius-icons',
  prefix: 'di',
  count: icons.length,
  icons: icons.map((i) => i.name),
  groups,
};
writeFileSync(resolve(root, 'icons', 'icons.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`split ${icons.length} icons -> icons/svg/`);
console.log(`wrote icons/icons.json (${groups.length} groups)`);
const uncats = extras.length ? ` (${extras.length} uncategorized)` : '';
console.log(`groups: ${groups.map((g) => g.name).join(', ')}${uncats}`);
