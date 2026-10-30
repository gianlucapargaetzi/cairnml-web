# 05 Color system

Colors are **CSS variables** generated from the Material 3 theme (`styles/themes.scss`, `cairnml-palette.scss`, `customizations/colors.scss`). Resolved values below were obtained by compiling the global stylesheet. Always use the variable, never the hex.

## Surfaces and text

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--color-surface` | #FAF9FD | #0F141A | Page background, header, side nav |
| `--color-surface-container-lowest` | #FFFFFF | #0A0E14 | Cards, dialogs (light), table body rows |
| `--color-surface-container-low` | #F0F3FC | #1A1C1E | Menus, dialogs (dark), alternative panel |
| `--color-surface-container` | #FAF9FD | #0A0E14 | Neutral container (overridden in colors.scss) |
| `--color-surface-container-high` | #E5E8F1 | #262A31 | Dividers, table header, hover for rows |
| `--color-surface-container-highest` | #E3E2E6 | #31353C | Slider tracks, strongest container |
| `--color-on-surface` | #1A1C1E | #E3E2E6 | Primary text |
| `--color-on-surface-variant` | #43474E | #DFE2EB | Secondary text, labels, icons |
| `--color-outline` | #73777F | #8D9199 | Control borders on hover, strong borders, placeholder text |
| `--color-outline-variant` | #C3C6CF | #43474E | Default borders |
| `--color-empty-state` | #ABABAE | #76777A | Empty-state text and icon (existing) |
| `--color-scrim` | #000 | #000 | Overlay backdrop |

Muted text = `--color-on-surface-variant`. Disabled text/controls = Material's disabled state (38% of `on-surface`); do not define another.

## Brand and action colors

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--color-primary` | #0060A7 | #A1C9FF | Primary actions, links, active nav, selected rows, focus, header text |
| `--color-on-primary` | #FFFFFF | #00325A | Text on primary |
| `--color-primary-container` | #D2E4FF | #004880 | Subtle primary background, selected chips |
| `--color-on-primary-container` | #004880 | #D2E4FF | Text on primary container |
| `--color-secondary` | #1B58C5 | #B1C5FF | Secondary buttons (`.secondary-button`, 0 uses) |
| `--color-secondary-container` | #DAE2FF | #00419F | Menu item focus/hover background |
| `--color-tertiary` | #006B5A | #75D8C0 | Tertiary buttons (4 uses). Rare accent |
| Tint helpers | `--color-tint-5/8/11/12/14` | | Primary at N% alpha for hover/selection overlays |

Hover/active/selected states are derived, not new colors: hover = `color-mix(in srgb, <base>, var(--color-on-surface) 4%)` (existing table rows), selected row = `--color-primary` with `--color-on-secondary` text (existing), selection tint = `--color-tint-8`. Do not add hover hex values.

## Semantic colors (feedback)

| Meaning | Variable | Light | Dark | Use |
|---|---|---|---|---|
| Danger / error | `--color-error` / `--color-on-error` | #BA1A1A | #FFB4AB | Validation errors, destructive buttons, failed operations |
| Success | `--color-success` | #199732 | #95F4A8 | Confirmation toasts and icons |
| Warning | `--color-warning` | #FF5602 | #FD8934 | Warnings that need attention but do not block |
| Info | `--color-completed` (blue) | #009AFF | #15A1FF | Informational toasts. **Gap:** there is no `--color-info`; add `--color-info: var(--color-completed)` |
| Focus | `--color-primary` | | | Focus ring |

Rule: semantic colors carry meaning only. Red means error, destructive or failed. Do not use red/green/orange for decoration or for categories (tags use the dedicated tag colors).

## Status colors (Standard)

Shared by `sm-status-icon-label`, circle status, charts and badges. One status, one color, in the whole product.

| Status | Variable | Light | Dark | Icon | Label |
|---|---|---|---|---|---|
| draft / created | `--color-draft` | #5D5E62 | #D9D9DD | draft | Draft |
| pending / queued | `--color-pending` | #005B4C | #68DAC0 | pending | Queued |
| running / in progress | `--color-running` | #1EA26C | #50E3C2 | spinner/running | Running |
| completed / stopped / aborted / closed | `--color-completed` | #009AFF | #15A1FF | success | Completed, Stopped, Aborted |
| failed | `--color-failed` | #A4020D | #FFB4AB | alert | Failed |
| published | `--color-published` | #4C6F00 | #D3FF00 | published | Published |

Known deviation: in the code `queued` is shown in the *draft* grey (`status-icon-label.component.scss`: `.created, .queued, .draft, .pending → --color-draft`) while the alias table defines `--color-queued: var(--color-pending)`. **Target:** queued uses `--color-pending` everywhere, so waiting is visibly different from a draft. `aborted` and `stopped` share the "completed" blue: the label must say "Aborted" / "Stopped" so the color does not lie about success (target: show an icon difference).

Pipeline steps add `skipped`, `cached`, `executed` container colors (`--color-skipped-container`, `--color-cached-container`, `--color-executed-container`): used only in pipeline graphs.

## Contrast

All text pairs must reach 4.5:1 (3:1 for 18px+ or 14px bold+ and for UI components). Known risks to verify (not yet measured with a tool): `--color-empty-state` on surface (#ABABAE on #FAF9FD is about 2.2:1 and fails), `--color-warning` light (#FF5602) as text on white, `--color-completed` light (#009AFF) as text on white (about 3:1), `--color-outline` placeholder text. Do not use these as small body text; use them for icons ≥ 16px with a text label next to them, or darken the token.

## Rules

1. No hex, `rgb()` or named colors in component SCSS, templates or TypeScript. At the time of writing there were 270 distinct hex values in SCSS and 132 hex literals in templates/TS; they are migrated per the plan.
2. The SCSS palette variables in `variables.scss` (`$blue-*`, `$neon-*`, …) are legacy for the old dark theme and must not be used in new code. `cairnml-palette.scss` also contains an unused first palette (`$palettes1`, primary #545D7F) next to the active one (verify and delete).
3. Charts use their own categorical palette (`--color-total` etc.); do not reuse status colors for chart series.
4. Every new color need is first expressed with an existing role. Add a variable only for a new *meaning*, in both themes, in `customizations/colors.scss`.
