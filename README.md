# decius.css

**A CSS framework for digital content creation (DCC) tools, synths, and pro desktop interfaces.**
Dark, dense, and token-driven — the vocabulary your power users already speak (Blender, DaVinci
Resolve, Vital), distributed as plain CSS, a zero-dependency JS runtime, an icon font, and
self-hosted type. One download, no dependencies.

decius is built for **[affineui](https://github.com/benjcooley/affineui)** — a zero-dependency C++
HTML/CSS renderer for native apps and games — and runs in any modern browser too.

- 📖 **Docs & live demos:** https://benjcooley.github.io/decius-css/
- 📦 **npm:** [`decius-css`](https://www.npmjs.com/package/decius-css)
- 🪪 **License:** MIT (framework + icons) · SIL OFL 1.1 (bundled webfonts)

> Status: **v0.4.0 "Mus"** — early, but complete enough to build real tools with.

---

## Why decius

| | |
|---|---|
| **Zero runtime** | One stylesheet with the fonts and icon font baked in. No compile step, no design-system tax. |
| **Tokenized to the wall** | Every color, size, radius, shadow and motion value is a CSS custom property. Re-theme by overriding a handful of variables — at runtime, no rebuild. |
| **Built for pros** | Combo number fields, knobs, bipolar sliders, dockable panels, tree/table/list, curve & node-graph editors, menus, popovers, toasts, even skeuomorphic hardware. |
| **Behavior, no framework** | `decius.js` — a tiny vanilla runtime with a Bootstrap-style data API — drives modals, menus, popovers, tabs, toasts, and the drag controls. No React required. |
| **Scoped** | Everything lives under `.dcs`, so the framework never leaks into the rest of your page. |
| **225 icons as a font** | A `<i class="di di-cube">` glyph that inherits `currentColor` and `font-size`. |

## Install

### From a CDN (zero build)

```html
<!-- everything: self-hosted fonts + icon font + framework -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/decius-css@0.4/dist/css/decius.bundle.min.css">
```

### From npm

```bash
npm install decius-css
```

```js
// plain CSS artifacts
import 'decius-css/css/decius.bundle.min.css';

// …or compile from the Sass source and theme it yourself
@use 'decius-css/scss/decius';
```

Or [download the `.zip`](https://benjcooley.github.io/decius-css/) (css + js + fonts) from the docs site.

### Then wrap your UI

```html
<link rel="stylesheet" href="…/decius.bundle.min.css">
<script src="…/decius.min.js"></script>      <!-- optional: component behavior -->

<div class="dcs" data-dcs-density="comfortable">
  <button class="dcs-btn dcs-btn--primary">
    <i class="di di-render"></i>
    Render
  </button>
</div>
```

## JavaScript

Stateful components (modals, menus, popovers, tabs, toasts, splitter resize, and the drag controls
— sliders, faders, knobs, combo fields) are driven by **`decius.js`**, a zero-dependency vanilla
script with a Bootstrap-style data API. It auto-initializes on `DOMContentLoaded`.

> **Scope:** `decius.js` covers per-component behavior. A full **drag-to-dock layout manager**
> (rearranging panes by dragging tabs into center/edge drop-zones) is application-level — it ships as
> a **React reference component** in the docs site, and on [affineui](https://github.com/benjcooley/affineui)
> the host provides docking natively. The framework gives you the CSS (`.dcs-dock`, `.dcs-dockpane`,
> `.dcs-splitter`, `.dcs-menubar`) and the menu/tab/splitter behaviors out of the box.

```html
<!-- data API -->
<button data-dcs-toggle="modal" data-dcs-target="#m">Open</button>
<div data-dcs-slider data-min="0" data-max="1" data-value="0.6"></div>
```

```js
// programmatic API
decius.toast({ title: 'Saved', variant: 'ok' });
decius.modal.open('#confirm');
decius.init(container);   // wire up dynamically-added markup
```

It's also an ES module: `import decius from 'decius-css/js'`.

## Theming

decius themes at **runtime** through CSS custom properties and `data-dcs-*` attributes on any
container — the attribute reshapes everything inside it:

```html
<div class="dcs"
     data-dcs-density="compact"     <!-- compact · comfortable · spacious -->
     data-dcs-radius="round"        <!-- sharp · (default) · round       -->
     data-dcs-accent="violet"       <!-- blue · cyan · orange · violet · green -->
     data-dcs-dark="darker"         <!-- darker · (default) · lighter     -->
     data-dcs-style="3d">           <!-- flat (default) · 3d synth bevels -->
  …
</div>
```

Or override the tokens directly:

```css
.dcs { --dcs-accent: #ff6b9d; --dcs-r-3: 8px; }
```

## What ships

Everything is built into `dist/`:

| File | What |
|---|---|
| `dist/css/decius.css` / `.min.css` | The framework (dark, scoped to `.dcs`). |
| `dist/css/decius-web.css` / `.min.css` | Light web/docs theme (`--dw-*`) for marketing pages & docs. |
| `dist/css/decius-icons.css` | `@font-face` + `.di-*` classes for the icon font. |
| `dist/css/decius-fonts.css` | `@font-face` for self-hosted IBM Plex Sans + JetBrains Mono. |
| `dist/css/decius.bundle.css` / `.min.css` | One drop-in file = fonts + icons + framework. |
| `dist/js/decius.js` / `.min.js` / `.esm.js` | Vanilla component runtime (IIFE global + ES module). |
| `dist/fonts/decius-icons.woff2` | The 225-glyph icon web font. |
| `dist/fonts/*.woff2` | Self-hosted text webfonts (latin + latin-ext). |
| `dist/decius-css.zip` | Everything (css + js + fonts) in one archive. |

## Repository layout

```
scss/            Sass source (Bootstrap-style partials → dist/css)
  core/          the framework, split by section
  web/           the light docs/web theme
icons/
  svg/           per-icon SOURCE svgs (the icon font is built from these)
  icons.json     icon catalog manifest
js/src/          vanilla component runtime (decius.js) source
fonts/           vendored self-hosted text webfonts + OFL licenses
examples/        standalone, framework-only usage examples (kitchen-sink.html)
scripts/         build pipeline (css, icon font, fonts, js, bundle, zip)
  outline_icons.py   stroke→fill outliner (Shapely) used by the icon-font build
site/            the documentation site (Vite + React)
dist/            built artifacts (committed, CDN-served)
design/          original design deliverable (provenance)
```

## Building locally

Requires **Node ≥ 18** and **Python 3** with `shapely` + `svgelements` (for outlining the
stroke icons into the icon font).

```bash
npm install
pip install shapely svgelements

npm run build        # → dist/  (fonts, icon font, css, bundle)
npm run lint         # stylelint the SCSS
npm test             # build css + smoke-test the artifacts
npm run dev          # run the docs site locally (needs one `npm run build` first)
npm run build:site   # build framework + docs site → _site/
```

## Browser support

Modern evergreen browsers and affineui. decius leans on CSS custom properties, flexbox, and grid;
there is no legacy IE support.

## Credits

- Design system & docs site by **Claude Design**.
- Bundled type: **IBM Plex Sans** (© IBM) and **JetBrains Mono** (© JetBrains) under the SIL OFL 1.1.

## License

[MIT](LICENSE) for the framework and icons. Bundled webfonts are under the
[SIL Open Font License 1.1](fonts/).
