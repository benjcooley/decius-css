# icons/ — icon source

The decius icon set: **225** stroke icons drawn on a 24×24 grid at 1.25px.

- `svg/<name>.svg` — the **source** for each icon (`fill="none" stroke="currentColor"`).
- `icons.json` — the catalog manifest (names + groups), the canonical icon list.

These SVGs are **source only**. The shipped delivery is a web font built from them:

```
icons/svg/*.svg
  └─ scripts/outline_icons.py      strokes → filled outlines (Shapely, deterministic)
       └─ scripts/build-icon-font.mjs   → dist/fonts/decius-icons.woff2
                                         → dist/css/decius-icons.css  (.di-* classes)
```

Use an icon with `<i class="di di-cube"></i>`. Stable codepoints are assigned from `U+E000` in
sorted name order, so the font is reproducible.

To add or change an icon, edit/add the source SVG, update the catalog in
`scripts/dev/split-sprite.mjs`, then `npm run gen:icons && npm run build:icons`.
