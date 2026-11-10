# Tokens, spacing, type and the page shell

Everything here was read from the code (`src/app/webapp-common/styles/`) and checked against the running app in light and dark mode. If a value you need is not here, find it in your twin's stylesheet; do not choose one.

## 1. Two token systems, one rule

| System | Where | Use it for |
|---|---|---|
| **CSS custom properties `var(--color-*)`** | `styles/customizations/colors.scss`, generated from the Material 3 theme, with light and dark values | **All colour**: surfaces, text, borders, status, brand. 232 of 348 stylesheets use it. |
| **SCSS variables** `$...` | `styles/variables.scss`, `layout/layout.scss` | Font sizes (`$font-size-small` 12px, `$font-size-regular` 14px), `$font-family-*`, z-index, transitions, layout heights. **Not colours.** |

Do not use `$blue-*`, `$card-bg`, `$table-bg` and the other legacy colour variables: they are a fixed dark palette and break light mode (3 stylesheets still use them; they are the exception, not the model). Do not write `#hex`, `rgb()`, `hsl()` in a component. The one allowed hex is a chart.js series colour (chart.js cannot read CSS variables): reuse `['#f57e23', '#fbc08f']` from the Workers dashboard, never a new palette.

Light and dark are chosen by the system setting. To check dark, emulate it (`reference/verify.md`).

## 2. Colour tokens and when to use each

Frequency is how often the token appears in component stylesheets, so you know which are the everyday ones.

**Surfaces (from the page outwards)**

| Token | Use |
|---|---|
| `--color-surface` (46) | The page background. You rarely set it; the shell does. |
| `--color-surface-container-lowest` (75) | Panels, KPI tiles, chart panels and white content areas: the "card" surface. |
| `--color-surface-container-low` (54) | A slightly raised or recessed block inside a page, expansion panels. |
| `--color-surface-container` (30) | Subtle blocks, code backgrounds. |
| `--color-surface-container-high` (94) | Table header background, bar tracks, dividers, hover fills. |
| `--color-surface-container-highest` (22) | Strongest neutral fill (selected rows, pressed). |

**Text**

| Token | Use |
|---|---|
| `--color-on-surface` (118) | Primary text. |
| `--color-on-surface-variant` (113) | Secondary text, labels, captions. Or `on-surface` with `opacity: 0.7`, as the `.sub` class does. |
| `--color-on-secondary-container` | Card titles and section titles (the blue-grey headings). |
| `--color-empty-state` (23) | Muted text and icons in empty states. |
| `--color-primary` (135) | Links, active tab, brand-coloured values, header title. |

**Lines**

| Token | Use |
|---|---|
| `--color-outline-variant` (127) | The normal 1px border of a card, panel, table box, divider. |
| `--color-outline` (86) | A stronger border: hover, focus, inputs. |

**Brand**: `--color-primary`, `--color-on-primary` (text on a primary fill), `--color-primary-container` / `--color-on-primary-container` (tonal chips and selected rows), `--color-tint-8` / `--color-tint-14` (a faint primary wash for hover or selection). **Error**: `--color-error`, `--color-on-error`, `--color-error-container`.

**Status** (the same word has the same colour on every page; never improvise a status colour)

| Token | Meaning |
|---|---|
| `--color-running` (alias `--color-in_progress`) | running, active, healthy, a held resource |
| `--color-pending` (alias `--color-queued`) | pending, queued |
| `--color-completed` (aliases `--color-stopped`, `--color-aborted`) | completed, stopped |
| `--color-failed` | failed, lost, error |
| `--color-draft` (alias `--color-created`) | draft, created, idle |
| `--color-published` | published |
| `--color-warning` | warning, attention, draining, high usage |
| `--color-success` | confirmation |
| `--color-*-container` | the tonal (softer) fill for each status, for backgrounds |

Component state classes on a badge are `state-ok` (running), `state-warn` (warning), `state-bad` (failed), `state-idle` (muted); they live in `mixins/panels.scss`.

## 3. Spacing

The spacing utilities come from Bootstrap's utility API (`styles/minimal-bootstrap.scss`) with this app's scale: `1` = 4px, `2` = 8px, `3` = 16px, `4` = 24px, `5` = 48px. The templates already use them heavily: `d-flex` (180 times), `align-items-center`, `w-100`, `h-100`, `ms-2`, `me-2`, `ms-3`, `gap-3`, `justify-content-between`, `flex-column`, `mt-2`, `mx-auto`, `overflow-hidden`. For small margins, gaps and flex alignment **use these classes in the template instead of writing CSS**.

In stylesheets use the CSS tokens, which are a different scale from the utility classes: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, **`--space-5` 24px**, **`--space-6` 32px**, `--space-7` 48px, `--space-8` 64px (`customizations/tokens.scss`). The page gutter is `--space-5`; `--space-6` is **not** 24px. Where each step is used is in `docs/design-system/02-design-tokens.md` ("Which spacing where"); dialogs have their own table in `reference/dialog-anatomy.md`. Look the relationship up; never choose a number by eye.

The rhythm in the stylesheets (these are conventions, not variables):

| Where | Value |
|---|---|
| Page gutter, left and right | **24px** (`padding: 0 24px 24px`) |
| Between sections of a page | **24px** (`display: grid; gap: 24px`) |
| Between cards or tiles in a row | **16px** (24px for folder-card grids) |
| Inside a panel | **16px 20px** (`.card`) |
| Between related items | **8 to 12px** |

Table and master/detail pages are **full-bleed** (no page gutter): the table and the toolbar run edge to edge.

**Before you add any padding or margin to a page, look at what already provides it.** The feature shell may add top padding (the Workers shell, `orchestration.component.scss`, adds `padding-top: 24px`). The page below it adds only the horizontal gutter. Read the parent's stylesheet; do not stack your own on top.

## 4. Type

Font: Heebo (`$font-family-base`). Monospace for ids, logs, code: `$font-family-monospace`.

| Size | Used for |
|---|---|
| 11 to 12px | captions, meta lines, badges, table header cells (`$font-size-small`) |
| 13px | secondary rows, usage values, feed text |
| 14px | body (`$font-size-regular`) |
| 15px | card titles, section titles and the title of a detail panel (the experiment info header uses 15px too), sentence case for section/card titles |
| 16px | expansion-panel titles |
| 28px | KPI numbers |

Weights: 400 and 500 only. **Sentence case** for titles, buttons, tabs, labels and badges. Uppercase only for the small section label inside a table or menu, set with CSS. The case you type is the case that shows (buttons are not transformed by the theme), so type buttons in sentence case and use `text-transform: uppercase` for headings that come from data.

## 5. The shell: what you get and what you must do

```
side nav (64px) | header 64px: title block (two lines) · feature tabs (centred) · symbol-only page buttons
 + search, help, | <router-outlet> then YOUR page, height = 100% minus the 64px header
   user at the    |
   bottom         |
```

- **The header is not yours to draw.** There is one for the application (`sm-header`). Your page hands it its title, status/tags and buttons with `<sm-page-header title="...">` (`[back]`, `[title-edit]`, `[status]`, `[actions]`); the component draws nothing in the page. Without it the title block works from the route (`header-titles.ts`). Line 1 is the specific thing, line 2 is its place from the root. Do not repeat the title in the page.
- **Buttons in the header are symbol-only**: `class="header-action"` with `data-tip="Add dataset"` and `aria-label="Add dataset"` on a `mat-flat-button` (primary, filled round) or `mat-stroked-button` / `mat-icon-button`. One primary at most. Text buttons are for dialogs, forms, toolbars and empty states.
- **Projection gotcha:** an `@if` block projects into a named slot only if it has exactly one root element. Put `[actions]` and `[status]` in separate blocks, each with one root, and keep a template reference and everything that uses it in the same block.
- **Header styles must not depend on your `:host`**: the buttons are drawn in the header, where your host is not an ancestor. Write their styles at the top level of the stylesheet, not nested in `:host`.
- **Panels** inside a page (detail of a task or model) use `<sm-panel-header>`, drawn in place, never `sm-page-header`.
- **Sticky rows** of your scroll container stick at `top: 0`; the header is outside it. Fixed heights count from `100vh - var(--header-height)` (64px).
- **Feature tabs** (the tab strip in the header): set from the feature's container with `headerActions.setTabs({contextMenu: ROUTES, active: feature})` and clear it in `ngOnDestroy` / `DestroyRef` with `headerActions.reset()`; add `canDeactivate: [resetContextMenuGuard]` on the route. See `features/workers-and-queues/orchestration.component.ts` and `workers-and-queues.consts.ts`.
- **A new top-level feature** gets exactly one item in the side nav (`webapp-common/layout/side-navbar`). Do not add a second navigation system.
- **Layout constants** you may use, from `webapp-common/layout/layout.scss`: `$top-bar-height` (64px), `$project-header-height` (56px, the toolbar row), `$projects-header-padding` (24px), `$experiment-info-header-height` (40px), `$experiment-info-tabs-height` (65px), `$graph-height` (364px). Import with `@use "../layout/layout";`.

**Your component's `:host` and root.** Pages scroll themselves; the shell does not.

```scss
// a content page (dashboard, cards, charts): the Dashboard tab's shell
:host { display: block; height: 100%; overflow: auto; }
.page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);   // required, see below
  gap: 24px;
  padding: 0 24px 24px;
  min-width: 0;
}
```

```scss
// a master/detail page: the split fills the page, each side scrolls itself
:host { display: block; height: 100%; overflow: hidden; }
.split { height: 100%; }
.master, .detail { height: 100%; overflow: auto; }
```

`grid-template-columns: minmax(0, 1fr)` is not optional. A grid with no explicit column creates one `auto` column that grows to the widest child (a chart, a table, a long name) and pushes the page wider than its pane. Symptoms: cut-off cards, a close button that is off-screen, a horizontal scrollbar. The same applies to any grid that holds a chart or a table: give its tracks `minmax(0, 1fr)`, or `min-width: 0` on the children.

A box around a table (`border` + `border-radius`) uses `overflow-x: auto`, never `overflow: hidden`: hidden silently clips the columns that do not fit. Add up the table's column widths and compare them with the **narrowest** pane the table can be in (a split detail pane is about 45 % of the page).

## 6. Shared styles to reuse (extract new ones, do not copy)

- `styles/mixins/panels.scss` → `@include panels.dashboard-panels();` gives `.card`, `.card-title`, `.section-title`, `.num`, `.sub`, `.badge` (`.caps`, `.state-*`), `.usage-bar`, `.bar`.
- `styles/mixins/progress.scss` → `progress.keyframes` (once, at the top level of the stylesheet), `progress.fill($stripe)` for a striped bar that moves ("still running"), `progress.idle` for the sliding segment of a run that has nothing to count. Colours `--progress-fill`, `--progress-stripe-strength`.
- `styles/mixins/empty.scss` → `empty-card-mixin()` for the centred empty state; `table-empty-message()` for "No data to show" inside tables.
- `styles/mixins/common.scss` → `recent-title()` (the small heading with a "View all").
- `styles/layout.scss` → `.sm-card-list-layout` (grid of 352px cards, 24px gap, `repeat(auto-fit, 352px)`, centred), `.sm-card-list-header` (toolbar above it), `.page-header`, `.sm-entity-page-header`, `.flex-middle`, `.d-flex-center`.
- `styles/utilities.scss` → `.pointer`, `.ellipsis`, `.noselect`, `.pointer-events-none`.

When you need a style that exists only in one page's stylesheet, move it to a mixin in `styles/mixins/`, use it from both, and say so in your report.

## 7. Icons

- The app's own icons are a font: `<mat-icon fontSet="al" fontIcon="al-ico-add"></mat-icon>` or `<mat-icon class="al-ico-dialog-x"></mat-icon>`; in other markup `<i class="al-icon al-ico-search"></i>`. SVG icons are the `i-*` classes in `styles/icons.scss`. Check the icon exists in `icons.scss` before you use its name.
- Every icon-only control has an `smTooltip`.

## 8. Layers

Use the z-index variables in `variables.scss` (`$zindex-dropdown`, `$zindex-modal`, `$zindex-tooltip` ...). Never a bare number.
