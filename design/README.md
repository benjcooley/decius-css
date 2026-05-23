# design/ — original deliverable (provenance)

This folder holds the original **decius.css** design deliverable produced by *Claude Design*: the
hand-authored CSS, the icon sprite, the React documentation app, and reference images. It is kept
for provenance — the *source of truth* for the framework now lives in [`../scss`](../scss),
[`../icons/svg`](../icons/svg), and [`../site`](../site), which were derived from this material.

Contents:

- `*.zip` — the original deliverable archives (styles, icons, app, uploads).
- `index.html` — the original CDN/Babel-runtime docs shell (superseded by the Vite site in `../site`).

## Regenerating derived source

The dev tools in [`../scripts/dev`](../scripts/dev) read from `design/_extracted/` (git-ignored).
To re-derive the SCSS partials or per-icon SVGs from the originals:

```bash
# unzip the archives into design/_extracted/ first, then:
node scripts/dev/split-source.mjs   # → scss/core, scss/web
node scripts/dev/split-sprite.mjs   # → icons/svg, icons/icons.json
```

Note: `split-source.mjs` documents two manual comment repairs that must be re-applied to the
skeuomorphic partial after regeneration (the original CSS has two orphaned comment tails that
browsers tolerate but Sass does not).
