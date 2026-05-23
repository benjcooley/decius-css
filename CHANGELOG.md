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
  foldouts, and skeuomorphic hardware elements.
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
