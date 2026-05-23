# fonts/ — self-hosted text webfonts

Vendored so decius has **no Google Fonts / CDN dependency** for type. Both families are licensed
under the **SIL Open Font License 1.1** (see each folder's `OFL.txt`).

| Family | Weights | Subsets | License |
|---|---|---|---|
| IBM Plex Sans (`ibm-plex-sans/`) | 400, 500, 600 | latin, latin-ext | OFL 1.1 |
| JetBrains Mono (`jetbrains-mono/`) | 400, 500 | latin, latin-ext | OFL 1.1 |

The build (`scripts/build-fonts.mjs`) copies these into `dist/fonts/` and emits
`dist/css/decius-fonts.css` with `@font-face` rules and per-subset `unicode-range`.

These files are vendored from the [Fontsource](https://fontsource.org) packages
`@fontsource/ibm-plex-sans` and `@fontsource/jetbrains-mono`. To refresh them after bumping those
dev-dependencies:

```bash
node scripts/dev/vendor-fonts.mjs
```
