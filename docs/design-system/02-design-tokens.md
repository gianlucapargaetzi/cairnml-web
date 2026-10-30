# 02 Design tokens

Values below come from the dominant values in the existing code (counts taken from the code on 2026-10-30) rounded to a 4 px grid. "Proposed token" means the CSS variable must be added to `:root` (see the block at the end); until then use the pixel value from the table, never another one.

## Important base fact

`html, body` have `font-size: 14px` (`styles/reboot.scss`). One `rem` is therefore **14 px** in this application. Bootstrap utility classes use rem, so `me-2` is 7 px, `ms-3` and `mb-3` are 14 px and `mt-4` is 21 px: none are on a 4 px grid. **Target:** do not use Bootstrap spacing utilities in new code; use the spacing tokens. Do not use `rem` in new code.

## Spacing (4 px grid)

| Token | Value | Use | Existing usage |
|---|---|---|---|
| `--space-1` | 4px | Icon-to-text in tight chips, between label and its value, inside badges | 4px: 231 uses |
| `--space-2` | 8px | Gap between related inline elements (icon and text, buttons in a group), compact padding | 8px: 123 |
| `--space-3` | 12px | Standard gap between related items; standard internal padding of small containers, menus and inputs | 12px: 431 (most common value) |
| `--space-4` | 16px | Gap between form fields; card and panel padding; gap between sections inside a card | 16px: 186 |
| `--space-5` | 24px | Page horizontal padding; gap between unrelated blocks; dialog padding | 24px: 279 |
| `--space-6` | 32px | Gap between page sections; empty-state padding | 32px: 103 |
| `--space-7` | 48px | Large separation (empty-state vertical space, hero areas) | 48px: 59 |
| `--space-8` | 64px | Maximum; header height equivalents | 64px: 44 |

Off-scale values found in the code (**to migrate**): 6px (209 uses), 14px (115), 20px (111), 10px (104), 18px (71), 5px, 15px, 30px, 3px. Rounding rule when migrating: 5,6 → 4 or 8 (choose by what it separates: related → 4, siblings → 8); 10,14,15 → 12 or 16; 18,20 → 16 or 24; 30 → 32. Keep 1px for borders and 2px for focus-ring offset only.

### Which spacing where

| Situation | Token |
|---|---|
| Padding inside a button | height 36 px (Material); horizontal 16px (default), 8px (`sm`), 4px (`xs`) |
| Icon next to its label | `--space-2` (8px); in dense rows `--space-1` |
| Buttons side by side | `--space-2` |
| Form field to form field | `--space-4` |
| Label to its control | Material form field handles it; do not add margins |
| Form section to form section | `--space-6` |
| Table cell horizontal padding | `--space-3` |
| Card padding | `--space-4` |
| Gap between cards in a grid | `--space-5` (existing `sm-card-list-layout` uses 24px) |
| Page horizontal padding | `--space-5` (24px: header, entity header, card list all use 24px) |
| Page header to content | `--space-5` |
| Section to section | `--space-6` |
| Dialog padding | `--space-5` |
| Menu panel padding | `--space-1` (existing 4px) |

## Radius

| Token | Value | Use | Existing |
|---|---|---|---|
| `--radius-sm` | 4px | Inputs, small containers, tags, code chips, menus, tooltips, table corners | 4px: 109 uses |
| `--radius-md` | 6px | Cards and panels | card `$card-border-radius: 6px`; 14 uses |
| `--radius-lg` | 12px | Chips/badges in pill-less form, large containers | 12px: 6 |
| `--radius-full` | 9999px / 50% | Avatars, status dots, circular icon buttons | 50%: 18 |

Buttons use the Material 3 default shape (the code does not override it; `--mat-button-filled-container-shape` is used by `experiment-compare-header`). **Do not override button shape.** Dialogs use the Material default surface shape plus a 1px `--color-outline-variant` border (existing). Remove one-offs: 2px, 3px, 5px, 18px, 30px, 32px, 36px, 45%.

## Borders and dividers

| Token / rule | Value |
|---|---|
| Border width | 1px, always |
| Default border | `1px solid var(--color-outline-variant)` (dialog surface, inputs) |
| Row and section divider | `1px solid var(--color-surface-container-high)` (header, side nav, table rows: existing) |
| Strong/hover border | `var(--color-outline)` |
| Focus | see [09-accessibility.md](09-accessibility.md): 2px ring `var(--color-primary)`, offset 2px |

## Elevation

The app is flat: surfaces are separated by tone (`--color-surface*`) and 1px borders. Menu panels explicitly set elevation level 2 to `none` and use a border (`menus.scss`, `tooltip.scss`). 53 `box-shadow` declarations exist; most are one-offs.

| Level | Use | Treatment |
|---|---|---|
| 0 | Page, side nav, header | `--color-surface`, bottom/right 1px divider |
| 1 | Cards, panels | `--color-surface-container-lowest` or `-low`, 1px border; **no shadow** |
| 2 | Menus, select panels, tooltips, popovers | `--color-surface-container-low`, 1px `--color-surface-container-high` border; **no shadow** |
| 3 | Dialogs | `--color-surface-container-lowest` (light) / `-low` (dark), 1px `--color-outline-variant` border, scrim `rgba(0,0,0,0.2)` (existing) |
| 4 | Toasts | `--color-surface-container-lowest` (light) / `-high` (dark), existing |

**Rule:** do not add `box-shadow` to components. Exception: scroll-affordance shadows (inset) such as in the side nav.

## Sizing

| Element | Size | Notes |
|---|---|---|
| Button / input / select / chip row | **36px** height (default), **24px** (`sm`), **20px** (`xs`) | Existing: `--mat-button-*-container-height: 36px`, form field container 36px |
| Icon (in text, buttons) | **16px** inline with 12-14px text; **20px** default (menus, icon buttons, toolbars) | Existing 16/20; `xs` buttons use 14px |
| Large icon (empty states, dialog headers) | 48px | |
| Avatar | 32px | header avatar |
| Header | **64px** | `$nav-bar-height` |
| Side nav width | **64px** (collapsed, the only state shown) | `$side-bar-close-width`; the 220px open width is defined but not used by the current template |
| Table row | 40px (target; confirm per table) | |
| Dialog width | sm 430px, md 640px, lg 768px, xl 1024px, xxl 1200px, full-screen (viewport − 32px) | existing classes `dialog-*`; `dialog-md` is passed 36 times, `dialog-sm` 3, `dialog-lg` 2, full-screen 6 |
| Menu panel | min 114px, max 450px | existing |
| Toast | 380px message width | existing |

## Z-index

Use only these (existing `variables.scss`): dropdown 1000, sticky 999, fixed 1030, modal backdrop 1040, modal 1050, popover 1060, tooltip 1070. Do not add values above 1070. `$generic-base-z-index: 99999` (used for `.stick-to-corner`) is a legacy escape hatch; **do not use it in new code**.

## Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 150ms | hover and focus state changes, row action reveal (existing 0.2s) |
| `--duration-base` | 250ms | panels, expanders, menus |
| easing | `cubic-bezier(0.2, 0, 0, 1)` | all |

Existing `$transition-fast: 0.3s`, `$transition-slow: 0.6s` → map to base; remove slow. Respect `prefers-reduced-motion` (none present today): set durations to 0 under that media query.

## Breakpoints

The app is desktop-first and designed for ≥ 960px wide (body has `overflow: hidden`; the layout is a fixed 64px side nav plus a fluid area). 12 different media queries exist (990, 960, 1080, 1200, 1300, 1400, 1620, 1740, and two height queries).

| Token | Width | Behaviour |
|---|---|---|
| `--bp-md` | 960px | below: single column grids, header tabs collapse (target) |
| `--bp-lg` | 1200px | default layout |
| `--bp-xl` | 1600px | wide layouts get extra columns, never wider content (see max widths) |

Replace 990 → 960; 1080/1300 → 1200; 1400/1620/1740 → 1600 case by case. Phones are not a supported target; tablets (≥ 960px) are.

## Proposed token block

Add to `styles/customizations/` as `tokens.scss`, included in `:root`:

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  --radius-sm: 4px; --radius-md: 6px; --radius-lg: 12px; --radius-full: 9999px;

  --control-height: 36px; --control-height-sm: 24px; --control-height-xs: 20px;
  --icon-size: 20px; --icon-size-sm: 16px; --icon-size-xs: 14px; --icon-size-lg: 48px;
  --header-height: 64px; --sidenav-width: 64px; --page-padding-x: var(--space-5);

  --font-size-xs: 11px; --font-size-sm: 12px; --font-size-md: 14px; --font-size-lg: 16px;
  --font-size-xl: 20px; --font-size-2xl: 24px;
  --font-weight-regular: 400; --font-weight-medium: 500; --font-weight-bold: 700;
  --line-height-tight: 16px; --line-height-body: 20px; --line-height-title: 24px;

  --duration-fast: 150ms; --duration-base: 250ms;
  --focus-ring: 2px solid var(--color-primary);
}
```

Dark theme needs no changes for these (they are not theme dependent).
