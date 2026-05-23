# Contributing to decius.css

Thanks for your interest! decius is a small framework with a deliberate, opinionated design — PRs
that fit that direction are very welcome.

## Setup

```bash
npm install
pip install shapely svgelements   # only needed to rebuild the icon font
npm run build
npm run dev                       # docs site at the printed localhost URL
```

## Project model

- **Source of truth is `scss/`.** The framework is authored as Bootstrap-style SCSS partials that
  compile to `dist/css`. The runtime theming mechanism is the `--dcs-*` CSS custom properties — Sass
  is for organisation and build, not for build-time theming. Don't replace tokens with Sass variables.
- **Icons are stroke SVGs in `icons/svg/`.** The shipped icon **font** is generated from them
  (`scripts/outline_icons.py` outlines the strokes; `scripts/build-icon-font.mjs` builds the font).
  We do not ship SVGs as artifacts — add/edit the source SVG and rebuild.
- **`dist/` is committed** so the CDN-by-tag and the docs site work directly. Run `npm run build`
  and commit the result with your change.
- **`design/` is provenance** (the original Claude Design deliverable). The dev regeneration tools
  in `scripts/dev/` read from `design/_extracted/` — unzip `design/*.zip` there if you need them.

## Before opening a PR

```bash
npm run lint     # stylelint (correctness-focused, faithful to the design)
npm test         # build css + smoke-test artifacts
npm run build    # regenerate dist/ and commit it
```

## Adding an icon

1. Add `icons/svg/<name>.svg` (24×24 viewBox, `fill="none" stroke="currentColor" stroke-width="1.25"`).
2. Add the name to a group in `scripts/dev/split-sprite.mjs`'s catalog (or it lands in "Misc").
3. `npm run gen:icons` to refresh `icons/icons.json`, then `npm run build:icons`.

## Releasing

Releases are automated by `.github/workflows/release.yml` — pushing a `v*` tag
builds, lints, smoke-tests, publishes to npm (with provenance), and creates a
GitHub release with `decius-css.zip`.

One-time setup: add an **`NPM_TOKEN`** repo secret — an [npmjs.com](https://npmjs.com)
**granular/automation token** with publish permission for `decius-css` and
*bypass 2FA* enabled:

```bash
gh secret set NPM_TOKEN     # paste the token when prompted
```

Then cut a release:

```bash
npm version patch           # bumps package.json + creates the vX.Y.Z tag
git push --follow-tags      # pushes main + the tag → triggers the workflow
```

The workflow fails fast if the tag doesn't match `package.json`'s version.

## Commit style

Keep commits focused. Describe the *why*. Match the surrounding code's conventions.

## License

By contributing you agree your contributions are licensed under the project's [MIT license](LICENSE).
