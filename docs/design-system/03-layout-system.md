# 03 Layout system

## 3.1 Application shell (Standard)

Defined in `app.component.html` / `.scss`, `layout/side-nav`, `webapp-common/layout/header`.

```text
+------+----------------------------------------------------------------+
| Side | Header (64px): breadcrumbs + task trail | context tabs | actions |
| nav  +----------------------------------------------------------------+
| 64px | Page content (router outlet), height = 100% - 64px             |
|      |                                                                |
+------+----------------------------------------------------------------+
```

- **Side navigation** (64px, always collapsed): logo, then icon links in this order: Agents & Queues, Datasets, Projects (dashboard), Pipelines. Model Endpoints is not in the navigation until CairnML documents how to create endpoints (decision for issue #13); the `/endpoints/active` page stays reachable by URL. Tooltips carry the names. Active item is highlighted by `routerLinkActive` / `.active`. Do not add a second navigation column. New top-level areas are added here only after a product decision; keep ≤ 7 items.
- **Header** (64px, grid `minmax(150px,1fr) auto minmax(150px,1fr)`, padding `0 24px`): left breadcrumbs (and task trail), centre context tabs (`sm-header-navbar-tabs`), right global actions (search [Ctrl+K], auto-refresh, help menu, avatar menu with Settings, Appearance, Logout). The header is the only place for global actions.
- **Main area**: the routed page fills the height below the header. The page itself scrolls internally (body is `overflow: hidden`), so **each page owns its scroll container**.
- **Breadcrumbs** show location, not history: Workspace → Project → entity.
- **Update banner** (`sm-update-notifier`, 30px) pushes the app down when active.

**Rules**

1. Pages never render their own top bar for global actions; put page actions in the page header (3.2).
2. Do not hide the side nav or header on working pages (login/share views are the only exceptions, existing `isLogin`, `isShareMode`).
3. Do not nest scroll containers more than two deep (page body, one inner panel such as a table or log).

## 3.2 Page structure (Target)

Today two pages use a shared header class (`.page-header`: serving, storage credentials; `.sm-entity-page-header` is the 56px variant) and the rest build their own. Use one structure:

```text
Page
├── Page header (height 56px, padding 0 24px, bottom 1px divider)
│   ├── [back button]  Title (16px / 500)   [status badge]
│   ├── description (optional, 12px, secondary) — below the title row, only when the purpose is not obvious
│   └── actions (right): secondary buttons, then ONE primary button
├── Tabs (optional): mat-tab-nav-bar, directly under the header
├── Toolbar (optional): search, filters, view options; padding 12px 24px
├── Content: scrolls; padding 24px
│   ├── Section (title 14px/500, gap 16px to its content)
│   └── Section (32px between sections)
└── Footer actions (forms only, see configuration-pages)
```

Header height 56px for entity pages (existing `$project-header-height: 56px`, `.sm-entity-page-header`). The 64px `.page-header` variant is **retired**: it duplicates the 64px application header directly above it. The projects list uses `$projects-header-height: 2*24 + 32 = 80px`: **target** 56px.

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
