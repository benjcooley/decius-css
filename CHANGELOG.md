# Changelog

All notable changes to decius.css are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.4.0] — "Mus" — 2026-05-23

First public release.

### Added
- Core framework `decius.css` (scoped to `.dcs`): panels, dock/split, buttons, inputs, sliders &
  faders, knobs, checks/switches, badges/tags/chips, kbd, alerts, modals, trees/tables/lists,
  toolbars, tooltips, color swatches & pickers, curve & node-graph editor surfaces, subpanels,
  foldouts, menus/dropdowns/context menus, popovers, toasts/notifications, and skeuomorphic
  hardware elements.
- **`decius.js`** — a zero-dependency vanilla component runtime with a Bootstrap-style data API
  (`data-dcs-*`) and a programmatic API (`decius.toast`, `decius.modal`, `decius.menu`, …). Drives
  collapse, modals, menus, popovers, tabs, toasts, dismiss/close, toggles, and the drag controls.
  Ships as IIFE (global `decius`), minified, and ES module.
- One-archive download `decius-css.zip` (css + js + fonts) and a `kitchen-sink.html` example.
- Runtime theming via `--dcs-*` CSS custom properties and `data-dcs-*` attributes
  (density, radius, accent, darkness, and a `3d` synth style).
- Light web/docs theme `decius-web.css` (`--dw-*`).
- **Icon web font** built from 225 source stroke icons (`<i class="di di-name">`).
- **Self-hosted text fonts**: IBM Plex Sans + JetBrains Mono (latin + latin-ext), no CDN dependency.
- One-include `decius.bundle.css` (fonts + icons + framework).
- Sass source organized as Bootstrap-style partials; Dart Sass + PostCSS build pipeline.
- Documentation site (Vite + React) with live, themeable component demos.
- CI (build + lint + smoke test) and GitHub Pages deploy.

[0.4.0]: https://github.com/benjcooley/decius-css/releases/tag/v0.4.0
