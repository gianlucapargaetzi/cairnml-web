# 03 Layout system

## 3.1 Application shell (Standard)

Defined in `app.component.html` / `.scss`, `layout/side-nav`, `webapp-common/layout/header`.

```text
+------+----------------------------------------------------------------+
| Side | Header (64px): title block | tabs (centred) | page buttons     |
| nav  +----------------------------------------------------------------+
| 64px | Page content (router outlet), height = 100% - 64px             |
|      |                                                                |
| search                                                                |
| help |                                                                |
| user |                                                                |
+------+----------------------------------------------------------------+
```

- **Side navigation** (64px, always collapsed): logo, then icon links in this order: Agents & Queues, Datasets, Projects (dashboard), Pipelines. Model Endpoints is not in the navigation until CairnML documents how to create endpoints (decision for issue #13); the `/endpoints/active` page stays reachable by URL. Tooltips carry the names. Active item is highlighted by `routerLinkActive` / `.active`. Do not add a second navigation column. New top-level areas are added here only after a product decision; keep ≤ 7 items.
- **Brand mark**: the CairnML symbol (the stone stack, without the wordmark) is the only logo in the UI. It is `src/assets/cairnml-symbol.svg` for light backgrounds and `src/assets/cairnml-symbol-white.svg` for dark ones. The branding settings (`branding.logo`, `branding.logoSmall` in `src/environments/base.ts`) name the `-white` file; the light theme drops the suffix, as the templates already do. The side navigation shows it at 64 × 64 px, the header at 54 × 42 px (height 42 px, the wordmark is not shown). Do not recolour or redraw it, and do not add the wordmark next to it.
- **Search, help and user menu** are at the bottom of the side navigation, stacked in this order, the user menu lowest (`sm-side-nav-actions`): Search all [Ctrl+K], Help (documentation, Python package setup, tips), Account (Settings, Appearance, Logout). They open their menus upwards. They are global and do not belong in the header.
- **Header** (64px, the height of the logo tile; the one and only header of the application, `webapp-common/layout/header`): a grid `minmax(0,1fr) auto minmax(0,1fr)` with padding `0 24px`. The two outer columns are always equal, so the **tabs are centred on the window** whatever the title or the buttons need.
  - **Title block** (left, two lines): line 1 is **what we are looking at**, 16px / 500: the project, task, model or report name, or the name of the page (Projects, Pipelines, Devices). Line 2 is **where it is**, 12px, secondary colour, from the root: `Projects / ui-audit / Task list`, `Settings`, `Agents`. Ancestors on line 2 are links. Derived by `header-titles.ts` from the route, the breadcrumbs and the active tab; a page can add its own title with `sm-page-header`.
  - **Tabs** (middle): `sm-header-navbar-tabs`, only when the page has tabs.
  - **Page buttons** (right): the `[actions]` of the page, preceded by auto-refresh and the My work / Team's work switch when the route asks for them. Buttons are symbol-only (3.2).
- **Brand mark in the header** exists only in a shared view without side navigation.
- **Main area**: the routed page fills the height below the header. The page itself scrolls internally (body is `overflow: hidden`), so **each page owns its scroll container**.
- **The trail on line 2** shows location, not history: Section → Project → page or tab.
- **Update banner** (`sm-update-notifier`, 30px) pushes the app down when active.

**Rules**

1. Pages never render their own top bar. Page buttons go in `sm-page-header` `[actions]` (3.2); search, help and the user menu are in the side navigation.
2. Do not hide the side nav or header on working pages (login/share views are the only exceptions, existing `isLogin`, `isShareMode`).
3. Do not nest scroll containers more than two deep (page body, one inner panel such as a table or log).

## 3.2 Page structure (Standard)

There is **one header** for the whole application (3.1). A page does not draw a header row; it hands content to the application header with the shared component `sm-page-header` (`webapp-common/shared/ui-components/layout/page-header`), which renders nothing in the page itself. Inputs: `title` (the name of the page; the header uses it for line 1 on list and settings pages), `description` (optional). Content projection: `[back]` (back button, before the title), `[title-edit]` (an inline-editable name, inside the title), `[status]` (status badge or the tag list, directly after the title), `[actions]` (the buttons of the page).

A page without `sm-page-header` still has a header: the title block works from the route.

**Buttons in the header are symbol-only.** One class does it: `class="header-action"` with `data-tip="Add dataset"` and `aria-label="Add dataset"` (same text) on a `mat-flat-button` (primary, a filled round "+" or another symbol), `mat-stroked-button` (secondary, round, outlined) or `mat-icon-button`. The label is the tooltip on hover and focus. Rules: at most one primary action; the symbol is the one of the action (`al-ico-add` for create/add, `al-ico-publish`, `al-ico-undo`, `al-ico-success` for save); the label is a verb plus the thing in sentence case (`New task`, `Add credential`). Do not put a text label in the header. Buttons inside the content (empty states, toolbars) keep their text.

**Tags** of the page (a report, for example) go in the `[status]` slot, so they follow the title; they are not buttons.

Panels inside a page (the detail of a task or a model, a pipeline run) keep their own header with `sm-panel-header` (`webapp-common/shared/ui-components/layout/panel-header`); it is drawn in place and has the same slots.

```text
Application header (64px, 3.1)
├── Title block: name (16px / 500), below it where it is (12px)
├── Tabs, centred
└── Page buttons: symbol-only, the primary one filled and round

Page (scroll container(s); height = 100% - 64px)
├── Toolbar (optional, 56px / 48px): search, filters, view options; sticky at the top of the scroll container
├── Content: padding 24px
│   ├── Section (title 14px/500, gap 16px to its content)
│   └── Section (32px between sections)
└── Footer actions (forms only, see configuration-pages)
```

Sticky rows inside a page stick at `top: 0` of their scroll container: the header is outside it. Fixed heights count from the window minus 64px (`--header-height`), not minus 120px.

## 3.3 Page templates

| Page type | Use for | Reference | Structure |
|---|---|---|---|
| List page | Collections: tasks, models, datasets, pipelines, queues, agents | [patterns/list-pages.md](patterns/list-pages.md) | header, toolbar, table, footer/pagination |
| Card overview | Projects overview, dataset collections | list-pages (card variant) | header, toolbar, `sm-card-list-layout` grid |
| Detail page | One entity: task, model, pipeline run, dataset version | [patterns/detail-pages.md](patterns/detail-pages.md) | header with status and actions, tabs, panels |
| Configuration page | Settings, credentials, create/edit forms | [patterns/configuration-pages.md](patterns/configuration-pages.md) | header, form sections, sticky action footer |
| Monitoring page | Agents & queues, endpoints | list page plus summary strip and chart panels | |
| Dashboard | Landing: recent projects/tasks | card overview | |

## 3.4 Content width and alignment

- **Tables, cards grids and detail panels:** fluid, full width of the content area. Do not cap table width.
- **Forms and text pages (settings, descriptions, markdown):** max width **720px**, left aligned at the page padding (not centred), so labels line up with page titles. Existing forms vary (dialogs 430-768px); in-page forms follow dialog-lg width.
- **Card grid:** `repeat(auto-fit, 352px)` with 24px gap (existing `sm-card-list-layout`); centred.
- Horizontal page padding is always `--space-5` (24px). Never add a second horizontal padding inside the content area; sections align on the same left edge.
- Minimum usable width of the content area: 960px − 64px side nav = 896px.

## 3.5 Vertical rhythm

| Between | Spacing |
|---|---|
| Page header and first content | 24px (`--space-5`) |
| Toolbar and table | 0 (the toolbar sits directly on the table; the table has its own header row) |
| Section and section | 32px (`--space-6`) |
| Section title and its content | 12px (`--space-3`) |
| Form field and form field | 16px (`--space-4`) |
| Related buttons | 8px (`--space-2`) |
| Last content and footer actions | 24px |

Related content is closer than unrelated content: the gap *within* a group is always smaller than the gap *between* groups.

## 3.6 Responsive behaviour

- ≥ 1200px: full layout.
- 960–1199px: header tabs may collapse into a menu; two-pane detail layouts stack their second pane below (target).
- < 960px: not a supported target. Do not add new media queries below 960px. Dialogs may use `mobile-dialog` when opened on narrow viewports (existing).
- Tables scroll horizontally inside their own container; never the whole page. The first column (name) stays visible (sticky) on wide tables (target).
- Button groups wrap; the primary button stays rightmost/first-in-reading-order.
- Use only the breakpoints in [02-design-tokens.md](02-design-tokens.md).
