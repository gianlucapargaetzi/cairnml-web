# Tables and data lists

Implementation today: `sm-table` (`ui-components/data/table`) with row colors from the `--row-*` variables (`customizations/table.scss`), `simple-table`, `table-card`, and a PrimeNG `p-table` virtual scroller in 3 templates configured by `prime.preset.ts` (resizable columns, 8px resizer). **Standard:** use `sm-table` for list pages. Do not create a fourth table implementation; if `p-table` is used, it must be styled through the preset so it matches (`--row-border-color`, header color).

## When to use what

| Data | Use |
|---|---|
| Many records with several comparable attributes, sortable, selectable | Table |
| One record's properties | Key-value rows (`sm-labeled-row`) |
| A few entities where a preview matters (projects, models with thumbnails) | Card grid |
| Short list of names with one action | List inside a menu or panel |
| Two to five records compared side by side | The compare view |

## Table anatomy

| Part | Rule |
|---|---|
| Header row | 12px/500, sentence case (no uppercase), `--color-on-surface-variant`, background `--row-header-color` (`--color-surface-container-high`), sticky, 40px |
| Body row | 40px, 14px text, `--row-default-color`; hover = 4% `on-surface` mix; 1px bottom border `--row-border-color` |
| Cell padding | `0 12px` (`$table-cell-padding` and the `sm-table` cells; the old `0 0.75rem` was 10.5px at rem=14px). The devices table uses the same values |
| Alignment | Text left, numbers right (tabular figures), status/icons left; header aligns with its column |
| Selection | Leading checkbox column; select-all in the header; selected row fill `--color-primary` with `--color-on-secondary` text (existing). Selection shows a bulk-action bar in the toolbar |
| Row actions | Icon buttons in the last column, see [Row actions](#row-actions). Many actions that do not fit: one overflow icon button (`mat-menu`) at the row end. Frequent actions may show as icon buttons on hover **and on keyboard focus** (existing code reveals them only on `tr:hover`, making them unreachable by keyboard: **target** `tr:hover, tr:focus-within`) |
| Sorting | Click header; arrow icon shows direction; default sort is stated by the page (usually last update, descending) |
| Filtering | Toolbar above the table: search field first, then filter controls, then view options. Active filters are visible as chips with a clear control |
| Pagination | Virtual scrolling / load more. There is no page-number pagination in the app; keep it so. Show total count in the toolbar ("128 tasks") |
| Overflow | Table scrolls inside its container; name column sticky; truncate cells with `.ellipsis` and a tooltip with the full value |
| Column resize | Allowed (existing); persist per table |
| Status column | `sm-status-icon-label`; a running task that reports progress also gets the small [progress bar](progress.md) next to it |

## Column widths (fit columns)

A table with a fixed set of columns sets `[fitColumns]="true"` on `sm-table` (and `[resizableColumns]="false"`; users do not resize it). The widths are then measured, never typed (`fit-columns.ts`):

| Situation | Rule |
|---|---|
| Natural width | Every column is as wide as its widest content (header included) plus the cell padding |
| Panel wider than the sum | The free pixels are shared in proportion to the natural widths: a column that holds 20% of the content gets 20% of the free space |
| Panel narrower | The columns collapse (text cut with an ellipsis) in the order of `collapseOrder` on `ISmCol`: all columns of order 1 first, then 2, and so on. Columns of one order collapse together, in proportion to what they can give |
| Floor | A column never collapses below its header (label, sort and filter icons, padding). The label is always readable |
| Fixed | `fixedWidth: true` (row actions, checkbox): the column keeps the width of its content and is never collapsed. When even the headers do not fit, the table scrolls sideways and the fixed column stays at the right edge (sticky), so the actions are always completely visible |
| Never type widths | No `style: {width}` on a column of a fitting table. Give a `collapseOrder` instead; omitted = 5 |

Collapse orders (1 collapses first, 9 last). The name column is always last; the least useful or most reproducible column goes first.

| Table | Order (first to last), `actions` fixed |
|---|---|
| Repositories & Datasets list | ID (1), Last used (2), Added by (3), Type (4), Visibility (5), Access (6), Name (9) |
| Credentials of a repository | Last used (1), Owner (2), Project (3), App (4), Access (6) |
| Runs of a repository | Created (1), User (2), Used as (3), Status (4), Name (9) |
| Settings → Access | Valid for (1), Owner (2), Type (3), Status (6), Name (9) |
| Settings → Devices | Created (1), Owner (2), Kind (3), Last used (4), Status (6), Name (9) |
| Share control | Level (5), Shared with (9) |
| Agents (workers) | Version and mode (1), Iteration (2), Task running time (3), Last seen (4), Status (6), Currently running task (8), Agent (9) |
| Queues | Last updated (1), Next task (3), In queue (4), Agents (5), Queue (9) |
| Dashboard recent tasks | Started (1), Updated (2), Type (3), Task ID (4), Project (5), Status (7), Title (9) |
| Serving instances | CPU count (1), GPU count (2), Uptime (3), Requests per minute (4), Requests (5), Latency (6), Instance ID (9) |
| Model metadata, Execution parameters | Type (1), Value (8), Key / Name (9); an editable table, so not yet fitted: its cells are inputs |
| Experiments, Models, Serving endpoints, Dataset versions | Not fitted: the user chooses the columns and resizes them, and the width is saved. When one of them is moved to fit columns, use: status and name last; created, updated, user and tags first |
| Project settings tables (members, repositories, queues), Queue users | Plain tables of two to four columns in a narrow panel: name last, role / level next to last; actions fixed |

Check a fitting table at 3440, 1920, 1600, 1280 and 1024px wide: no cut header, actions inside the panel (`scripts/fit-check.js`, `scripts/row-actions.js`).

## Row actions

Measured on the Access page, Repositories, the project settings tables and the Datasets list (Chromium, 1600x900). Every table that acts on its rows follows this.

| Rule | Value |
|---|---|
| Control | `mat-icon-button`, with a 20px `mat-icon fontSet="al"` inside. The icon centre equals the button centre (0px offset on both axes). No extra size classes on the icon. Size: 36x36 for a single action; **28x28 with no gap between buttons when a row has two or more** (the `table-rows` mixin does this for `.row-actions`), so the icons sit 8px apart instead of 20px |
| Always visible | The actions are never cut off, wrapped or hidden behind overflow: the actions column has a fixed width that fits all its buttons (`width` and `minWidth` the same, `flex: none`). When the total column width exceeds the panel, the **other columns shrink** (down to their `minWidth`, text with ellipsis) and the actions stay whole |
| Place | The last column, header cell empty, buttons right-aligned. The last button's right edge mirrors the table's left cell padding: 24px gutter in full-width `sm-table`s (measured gap 27 to 28), 12px in the compact tables of the project settings (measured 12) |
| Height | Vertically centred in the row (measured offset 0 to 0.5px) |
| Visibility | Shown at once, not on hover, so keyboard users reach them. Disabled (not hidden) while a request for the row runs; hidden only when the user has no right to the action |
| Order | Specific actions first, the destructive one last: share, check, delete (Access); reassign, revoke (Devices); check now, more (share), delete (Repositories & Datasets); assign credentials, check now, delete (the credentials of a repository) |
| Name | `smTooltip` is a verb phrase ("Check now", "Remove from this project"); `[attr.aria-label]` is the verb plus the row it acts on ("Remove ui-audit app one"); `data-id` names the action |
| Danger | Delete, revoke and remove ask for confirmation (`sm-confirm-dialog`, `destructive: true`), except a row in a list that is staged until its Save button |
| Add | Never per row. The add action is the filled button of the table's section or page header (`al-ico-add`, see [buttons](buttons.md) rule 2a) |
| Reference vs action | A name that points to another resource is a pill ([badges](badges.md#references-to-things-in-the-app-sm-entity-chip)), not a button. The pill's own "×" is the only action allowed inside it |

Icons, by what the action does. Use the same icon for the same meaning everywhere:

| Meaning | Icon | Example |
|---|---|---|
| Delete or revoke something for good | `al-ico-trash` | Delete credential, Revoke device |
| Take something out of a place; the thing itself stays | `al-ico-dialog-x` | Remove from this project or queue, Stop sharing, Remove member |
| Share with a project | `al-ico-shared-item` | Share credential |
| Re-check, reload | `al-ico-refresh` | Check now, Refresh registry (a spinner replaces it while it runs) |
| Assign credentials | `al-ico-lock` | Repositories, task Datasets |
| Hand over | `al-ico-move-to` | Reassign device |
| Edit | `al-ico-edit` | Edit value |
| Download | `al-ico-download` | Download file |

Pitfalls found while building this: a component stylesheet that sizes `.al-icon` also hits the `mat-icon` inside every icon button of that component (the Access page's refresh and delete icons sat 2.7px low until the rule was scoped to the status icon); a flex wrapper with `align-items: center` is needed in a cell that holds a pill and a button, or the two sit at different heights.

## States

- **Loading** (first load): spinner centered in the table area, header stays. Background refresh: no spinner, subtle updated timestamp ([ux](../08-ux-guidelines.md)).
  `sm-table` shows a 24px spinner while it has no rows yet (`tableSate().loading()`).
- **Empty:** `table-empty-message` mixin text centered (14px, `--color-empty-state`); one sentence plus the action to create the first item when the user can ("No tasks yet. Create one with the SDK" + link to setup help). When filters hide everything: "No tasks match the filters" + "Clear filters".
- **Empty with a create action (for example reports):** when the list is empty (not loading), `sm-empty-state` replaces the table body and the table is hidden, so no row height constrains it. Title "No reports yet", one sentence, `Create report` as the primary button. The search variant is "No reports match the search" + "Clear search". A list with nothing to create by hand, such as queues (a queue is made when an agent is enrolled), has the same empty state without the button. `sm-table`'s `noDataTemplate` is not used for this: it renders inside a fixed-height row and clips the action.
- **Error:** inline message in the table area with "Retry"; keep the toolbar. `sm-table` takes `errorMessage` (shown instead of the empty text) and emits `retry` when Retry is pressed. The empty text is `emptyMessage` (default "No data to show").

## Exceptions (documented)

- **Metric grids** (`experiment-compare-metric-values`, `experiment-metric-data-table`): PrimeNG `p-table` with frozen label columns, a filter header cell and one column per run. `sm-table` has no frozen per-column metric layout, so these stay on `p-table`. They are styled through `prime.preset.ts` (row border, header colour) and must keep the table anatomy above.
- **Table card** (`sm-table-card`): the card template used by `sm-table` in its card view (`minimizedView`), not a separate table. It is one row of that table.
- **Lists inside detail panels** (`sm-simple-table-2`, queue entries and worker queues): a short reorderable list with drag and drop. It uses the same row height, header colour and cell padding as `sm-table`.

## Grouped rows (registry with its datasets)

Used by the Datasets list (`dataset-browser`). A parent row groups child rows of the same kind: a registry is the parent, its datasets are the children. Rules:

- The parent row shows the group's name, its owner and visibility, and the count of children in the Kind cell ("Registry, 3 datasets"). Its Modalities, Samples and Versions cells show "–".
- The name cell of a parent has an icon button with `aria-expanded` and an `Expand`/`Collapse` label (`al-ico-caret-right` closed, `al-ico-arrow-down` open). Expanded by default. A click on the parent row toggles it; a click on a child selects it for the side panel.
- Children are indented by `--space-5` inside the name cell and sorted by name. Rows without a parent stay flat.
- Row actions of the Repositories & Datasets list are icon buttons, shown at once: **Check now** (refresh; a spinner replaces the icon while it runs; for a registry it reads the registry again), a three-dot **More** menu (`al-ico-dots-v-menu`, `mat-menu`) holding "Make shared" (opens the share dialog, see `dialogs.md`) or, for the admin, "Make non-shared", and **Delete** (trash, last). Delete is never hidden: when the record cannot be deleted (a project lists it, or it is shared and the user is not the admin) the button is **disabled** and its reason is the tooltip, carried by a wrapper element (a disabled button shows no tooltip of its own). Delete removes the record for the user only; it is refused while a project depends on it.
- The credentials of a record (side panel, `sm-table` with `[scrollable]="false"`): **Assign credentials / Reassign** (lock), **Check now** (refresh) and **Delete** (trash, removes the user's own assignment, confirmed) on the user's own row only; other users' rows are read-only. The empty row has only the lock. Column order: App, Owner, Access (open green lock, closed red lock), Project (entity chips), Last used, actions.

## Do not

- Do not use cards where records are compared on attributes.
- Do not put a second scroll container inside a table cell.
- Do not use color alone for the status column (icon + label are in the component).

## Task name cell (`sm-task-name`)

Used by the experiments table and the dashboard's recent tasks table. A task in a table is shown as `name: id`: the name, a colon, then the task's id (the hash) in monospace. The name shrinks with an ellipsis when the cell is narrow, and the id stays visible. The full text is in a tooltip. Development tasks show the name in italics. Inputs: `name`, `taskId`, `italic`.

## Project settings sections (queues, datasets, repositories, credentials)

The project settings sections (`shared/project-dialog/project-settings/`) list what a project uses. Queues list the queues allocated to the project, with a **Level** column. The Datasets and Credentials sections list every dataset or credential the project can use (`projects.usable`): the public ones (**Scope** "Public", never removable here) and the ones shared with the project (**Scope** "Project", removable). Columns are Name, Scope, Level and Owner; a credential shows its host and path under its name. Level labels come from `SHARE_LEVEL_LABELS`.

- The header has the section title on the left and a pill "Add dataset" / "Add credential" button (`mat-flat-button` with the plus icon) on the right. Only the owner and collaborators of the project see the section; members do not see it.
- Adding opens a `dialog-sm` picker of the datasets or credentials the user may use and the project does not have yet. Confirming the dialog applies the change at once (`datasets.allocate`; `access.share` with level read); there is no Save step in any project settings section.
- A remove icon is shown only on a row whose `removable` flag is true. Removing asks for confirmation (`dialog-sm`, destructive) and then applies at once (`access.unshare` with the row's `share_id`).
- A dataset that a run made (inherited) shows "Inherited from an agent run" under its name. A credential that a dataset brought in is not removable and shows a lock icon with the hint "Added by dataset. Only manual credentials, e.g. for code repositories, can be changed in project settings.".
- Repositories (`sm-project-repositories`) list the repositories the project lists: its runs named them, or its owner listed them. Columns are Repository, Type, Access (the access badge) and Added by; the × takes the repository out of the project. The header's **Add** button opens the repository dialog with the project fixed. A listed repository is usable by the project's jobs at once, read with the project owner's credential. Data: `repositories.get_all` with the project, `repositories.add`, `repositories.unlink`.
- Queues revoke through `access.unshare` with the share's id: the owner, collaborators and admins see the action on a row with a share id. Adding queues stays owner-only.
