# Icons

## Library (Standard)

One icon set: the custom **`al` icon font** (`webapp-common/assets/fonts/trains.ttf` + `trains-icons.scss`, 165 distinct glyphs used in templates). The old font file name `trains` is a legacy name; the set stays until a replacement is decided (see migration plan).

| Markup | Count | Status |
|---|---|---|
| `<mat-icon fontSet="al" fontIcon="al-ico-NAME">` | 372 | **Standard** |
| `<i class="al-icon al-ico-NAME">` | about 30 | Legacy. Glyph icons with size `sm`, `sm-md` or `xl` were converted to the standard markup (`mat-icon` keeps the `al-icon` class for its size rules). Remaining: `xs`, `msm`, `md`, `lg`, `xxl`, `xxxl` sizes and brand images (`i-*`), which have no matching `mat-icon` size yet |
| `<a class="item al-ico-NAME">` (side nav) | 5 | Exception for the side nav; needs `aria-label` |
| Plain Material ligature icons (`<mat-icon>name</mat-icon>`) | 0 | Do not introduce |
| Font Awesome / PrimeIcons / Bootstrap Icons | 1 stray | Do not use |

## Sizes

| Size | Class / value | Use |
|---|---|---|
| 14px | `xs` | inside `xs` buttons, dense tags |
| 16px | `sm` | in text, in standard buttons next to labels, `sm` icon buttons |
| 20px | default | icon buttons, menu items, toolbars |
| 48px | `lg`/`xxl` | empty states, dialog headers |

## Rules

1. Icons communicate: use them for actions with a well-known glyph (refresh, search, close, delete, copy, settings). Do not decorate headings.
2. An icon-only control has `aria-label` and a tooltip.
3. Same meaning, same glyph, everywhere. Maintain a single glyph per concept (e.g. delete = `al-ico-trash`; confirm the name in the font file before using).
4. Color: icons inherit `currentColor`; default `--color-primary` for actionable icons in toolbars (existing `--mat-icon-button-icon-color: primary`), `--color-on-surface-variant` for informational ones; semantic colors only for status.
5. Decorative icons beside text have `aria-hidden="true"` (Material does this for `mat-icon` by default).
6. Alignment: vertically centred with the text's x-height; 8px gap to the label (4px in dense chips).
