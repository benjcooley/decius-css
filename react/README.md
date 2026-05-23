# react/ — decius React component layer

The **React** layer of decius — a reference implementation of the framework's
stateful components, used to build the documentation site.

This is one of three distinct layers; keep them separate:

| Layer | Where | What |
|---|---|---|
| **CSS** | [`../scss`](../scss) → `dist/css` | The framework itself. All styling, scoped to `.dcs`. The source of truth. |
| **Vanilla runtime** | [`../js`](../js) → `dist/js/decius.js` | Zero-dependency `decius.js`: data-attribute behaviors (modals, menus, popovers, tabs, toasts, collapse, the drag controls, splitter resize). No framework needed. |
| **React components** | **here** → (not published yet) | Richer React components — including the full drag-to-dock `DockLayout` — that wrap the same CSS. App-level concerns that don't belong in the tiny vanilla runtime. |

## Files

- `icons.jsx` — the font-backed `<Icon>` component + the icon catalog.
- `components.jsx` — the component library: `Panel`, `Button`, `Slider`, `Knob`,
  `Combo`, `Tabs`, `Tree`, `MenuBar`, `Toolbar`, `Splitter`, `DockLayout`, and the
  rest, plus small hooks (`useControl`, `useDismiss`, `MenuList`).

## Status & conventions

- **Not published as a package yet.** These files are compiled into the docs site
  by `vite.config.mjs` (concatenated with the docs sections into one module that
  reads a global `React`), so they currently use the shared-scope authoring style
  (top-level declarations + `Object.assign(window, …)`) rather than ESM imports.
- If/when we ship `decius-css/react`, this is the source to convert to a proper
  ESM module (`import React` + `export`) and build to `dist/react/`.
- On **[affineui](https://github.com/benjcooley/affineui)**, the host provides
  docking/behavior natively — this React layer is the browser-side equivalent.
