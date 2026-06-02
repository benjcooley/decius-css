# Changelog

All notable changes to decius.css are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.6.2] — 2026-06-02

### Fixed
- Restored edge splitting for docked panel groups when dragging panel tabs or tearoffs onto a docked pane edge.
- Kept floating tearoff targets tab-only while allowing tearoffs to dock to the app/window left, right, top, and bottom edges.
- Reduced window-edge dock previews and initial pane sizing to a smaller sidebar/shelf estimate instead of a half-screen split.

## [0.6.1] — 2026-06-02

### Fixed
- Fixed tearoff tabs that could not be moved or re-docked consistently after becoming floating panels.
- Fixed re-docking between tearoffs so tabs insert before toolbar/free-space chrome and do not leave dead copies in the document view.
- Fixed single-panel tearoff behavior: floating tearoffs collapse to a title-only panel when reduced to one tab, while docked panel groups keep their one-tab tabbar.
- Fixed tearoff drop targeting so floating tearoffs only accept add-tab drops, never vertical or horizontal split drops.
- Fixed floating tearoff containment so panels stay inside the document content area instead of covering document tabs, toolbars, or sidebar docks.
- Fixed floating panel and toolbar z-order so the last selected movable surface is topmost and the rest are compactly ordered beneath it.
- Fixed panel toolbar placement and active-tab toolbar switching across docked and floating panel states.
- Fixed nested inspector-style tabpanels so panel-specific content is hidden with its owning tab instead of leaking into sibling tabs.

## [0.4.1] — 2026-05-23

### Fixed
- Dark native scrollbars/controls leaked into light host pages: `color-scheme: dark`
  was on `:root`. It's now scoped to `.dcs`, and the `decius-web` theme declares
  `color-scheme: light`. `.dcs` regions stay dark; the host keeps its own scheme.

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

[0.6.2]: https://github.com/benjcooley/decius-css/releases/tag/v0.6.2
[0.6.1]: https://github.com/benjcooley/decius-css/releases/tag/v0.6.1
[0.4.1]: https://github.com/benjcooley/decius-css/releases/tag/v0.4.1
[0.4.0]: https://github.com/benjcooley/decius-css/releases/tag/v0.4.0
