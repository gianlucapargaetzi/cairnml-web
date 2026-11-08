# Navigation components

| Component | Where | Use |
|---|---|---|
| Side navigation (`sm-side-nav`) | Left, 64px | Top-level areas only: Agents & Queues, Datasets, Projects, Pipelines (Model Endpoints is hidden until endpoints can be created; see issue #13). Icon-only: each link **must** have an accessible name (today the `<a class="item al-ico-*">` links have none; add `aria-label` = tooltip text) |
| Side navigation actions (`sm-side-nav-actions`) | Bottom of the side navigation, stacked: Search all, Help, Account (lowest) | Global actions; their menus open upwards |
| Header title block | Header left | Line 1: what we look at (project, task, report, or the page name). Line 2: where it is, from the root (`Projects / ui-audit / Task list`); ancestors are links |
| Header context tabs (`sm-header-navbar-tabs`) | Header, **exactly centred** (grid `1fr auto 1fr`) | Sections of the current project (e.g. Overview, Tasks, Models…) |
| In-page tabs (`mat-tab-nav-bar` for routes, `mat-tab-group` for in-page panels) | Under the page header | Sections of one entity. Active label `--color-primary`, inactive `--color-outline`, no divider (a 1px bottom border optional via `with-border`) |
| Menu (`mat-menu`) | Anywhere | Action lists; account menu (side navigation): Settings, Appearance, Logout; help menu: documentation and setup links |
| Context menu | Right click on rows | Optional shortcut for the same actions the row menu has; never the only way |
| Links | In text | `routerLink`, `--color-primary`, underline on hover/focus |
| Pagination | Tables / grids | Virtual scroll; "Load more" button in grids; no page numbers |

## Rules

1. **Tabs navigate between views of the same thing**; buttons perform actions. Do not style buttons as tabs.
2. Use route-based tabs when each tab can be linked to; the URL reflects the tab (browser back works).
3. At most 7 tabs; sentence case labels ("Execution", "Artifacts"; not all-caps as `TASKS`, `PROJECTS` currently in header tab config).
4. The trail on line 2 of the header never contains actions.
5. After creating an entity, navigate to it; after deleting, navigate to the list.
6. Back buttons in headers (arrow-left icon button, existing in storage credentials) are for drill-in states inside a page, not a replacement for the trail.
7. Keyboard: Ctrl+K opens global search (existing); tabs support arrow keys (Material).
8. The side nav "Projects" item points to `/dashboard`; the naming differs from its target. Keep "Projects" as the label and treat the dashboard as the projects landing view.
9. **Every menu item has no ellipsis**: plain verb labels for actions, nouns for submenu triggers ("Add Tag"), and the same for items that open a dialog or a confirm (Archive, Reset, Publish, Delete). A count appended by the shared menu pipe is the only suffix: "Delete (1 item)". Destructive items go last, after a divider, in `--color-error`.
