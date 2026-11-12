# Page anatomy (measured, not guessed)

Measured with Playwright in Chromium at 1600x900, light theme, on the running stack with seeded data (`scripts/crawl.js`, `scripts/gap-report.js`). x and y are page pixels. **A new or changed page must match these numbers. Measure it; do not trust the code.**

## The shell (every page)

There is **one header**. The old top bar and the old per-page sub-header are gone.

| Part | Value |
|---|---|
| Side navigation | x 0..64, full height. Items from the top; **search, help and the user menu stacked at the bottom, the user menu lowest** (`sm-side-nav-actions`, y 772 / 812 / 852 at 900px height) |
| Header (`sm-header`) | y 0..64, height **64** (the height of the logo tile), bottom border 1px. Grid `minmax(0,1fr) auto minmax(0,1fr)`, padding `0 24px` |
| Title block (left) | line 1 at **x 88**: what we look at, 16px / 500; line 2 below it: where it is, 12px, secondary colour |
| Tabs (middle) | **exactly centred** on the header: the measured offset of their centre from the header centre is **0** at every width |
| Page buttons (right) | symbol only, the last one ends at x 1576 (24px from the edge); the primary one is a filled round button |
| Page gutter | **24px** (`--page-padding-x`). Content that is not a full-bleed table starts at x 88 and ends at x 1576 |
| Content | starts at **y 64**, height = window − 64 (`--header-height`). It scrolls under the header; the header stays |

Rules:
1. **Every page has the header with its title block**, including project pages, Compare and Settings pages. A page that registered no title with `sm-page-header` gets it from the route (`header-titles.ts`). Only the full-screen 404 and the login have no shell.
2. **Line 1 is the specific thing, line 2 is its place from the root.** `ui-audit-short` over `Projects / ui-audit / Task list`; `Devices` over `Settings`; `Agents & Queues` over `Queues`. The title is never repeated on line 2. Line 2 is never empty: the section, then the project, then the active tab, with the workspace name when there is nothing else.
3. **Buttons in the header are symbol-only**: `class="header-action"` with `data-tip` and `aria-label` (same text, sentence case verb + thing). The primary action is the first `mat-flat-button` (filled round "+" or its own symbol); help and other secondary actions are `mat-icon-button` or round outlined. Text buttons belong to dialogs, forms, toolbars and empty states. Toolbars hold only search, sort and filters, never the primary action.
4. **Tags of a page go next to the title** (`[status]` slot), not in the buttons.
5. Search, help and the user menu are **never in the header**.
6. Panels (the detail of a task or a model, a pipeline run) keep their own header: `sm-panel-header`, drawn in place.

## Page types

### A. Full-bleed table page (Agents & Queues > Queues is the reference)
Order from the top: header (y0..64) → optional block above the table (charts, at 24px gutter: x88..1576, first block top at y88) → toolbar row (**height 56**, content at x 88) → **table at x 64..1600 (0px gutter)** → nothing below. Table header row 40px, body rows 40px. An empty table has no scrollbar and the table runs to the bottom of its container.
- The table is **never inset**. Cards and charts are at 24px; tables are at 0.
- The toolbar sits **directly under the header or the block above it**, never in its own empty band. If a toolbar has nothing visible in it, it is not rendered.
- A table or a panel with nothing below it **stretches to the bottom of its container**, also when it is empty (flex column, `flex: 1 1 auto; min-height: 0`).

### B. Card grid page (Projects, Reports, Pipelines)
Header → toolbar row at y64, **height 56**, sticky at the top of the scroll container (`top: 0`), content at x 88 → grid of cards, cards at x 88 (24px), 24px gap. The primary action (New project / New report / New pipeline) is in the header, not in the toolbar.

### C. Tabbed list page (Datasets & Repositories, Agents & Queues, project Overview/Workloads/Tasks/Models)
Tabs are in the **header, centred** (`headerActions.setTabs` plus child routes). Each tab is a type A or B page. The tab changes only the content under the header; the title stays, the buttons may change (Add dataset / Add repository). The active tab is the last part of line 2.

### D. Dashboard
Header → blocks at 24px gutter (Recent projects, Recent reports) → **Recent tasks heading at 24px, its table at 0px (x 64..1600)**, same as type A. The "My work / Team's work" switch sits with the buttons on the right of the header.

### E. Master/detail (Tasks, Models, Datasets table + detail)
Header → toolbar → `as-split`: list left, detail right, 1px divider. The list table is at 0px gutter at the left edge. The detail panel has its own header (`sm-panel-header`) with name, id, actions.

### G. Reduced-width pages (project settings, overview, workloads)
Card-heavy and non-data pages are **centred at `--page-width-reduced`** (1080px) at every width, with the `reduced-page()` mixin from `styles/mixins/page-width.scss` (one constant, never a number per page). Project settings keeps its 24px top and 16px side padding as `--space-5` / `--space-4`. Pages whose main content is a data table stay full width (type A, E). `fit-check.js` does not flag `.settings-page`, `.info-content` and the workloads `.header` / `.graphs`; it flags any other centred block.

### F. Settings pages
The header shows the page name over `Settings`. The settings navigation column starts under the header; the content column starts at x 353. Every settings page has its title in the header. The table of Devices fills the area down to the footer.

### G. Empty state
`sm-empty-state`, centred horizontally in the content area, **first element at y 64 + 24 to 32 below the header**, icon, one bold title in sentence case ("No repositories yet"), one muted line, optional primary action. The empty state replaces the table; the toolbar and header stay. Never show an empty state under a populated table.

## What to measure after every change

```
node scripts/crawl.js out 1600 900 light pages
node scripts/gap-report.js out/audit.json
```
Check: header `64`, title `x88`, tabs `off0`, a trail on every page, toolbar y equal to its siblings of the same type, table `L0 R0`, blocks `L24 R24`, no horizontal scroll, content bottom = window bottom. Also at 1280×720 and 3440×1440 (`scripts/wide.js`). Then open the page and the pages next to it in the nav and compare the screenshots.

## Toolbar row (one rule)

Every list page has the same toolbar row: **56px high**, directly under the header (y 64..120) or, on Agents & Queues, directly under the block above it. Content at the 24px gutter, vertically centred. Pages: Projects, Pipelines, Reports, Tasks, Models (shared experiment header, 56), Queues (min-height 56). A toolbar that has nothing visible in it is not rendered. The toolbar is the sticky row of the scroll container (`top: 0`): the header is outside it.

## Empty tables

A table with no rows shows the shared `sm-empty-state` (icon, title in sentence case "No tasks yet", one muted line), never the bare text "No data to show". `sm-table` takes `emptyIcon`, `emptyMessage` (the title) and `emptyDescription`; the tasks and models tables put `sm-empty-state` in their no-data template. A table without rows is not a scroll area (`.no-rows`).
