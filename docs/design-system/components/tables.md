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

## Row actions

Measured on the Access page, Repositories, the project settings tables and the Datasets list (Chromium, 1600x900). Every table that acts on its rows follows this.

| Rule | Value |
|---|---|
| Control | `mat-icon-button`, 36x36, with a 20px `mat-icon fontSet="al"` inside. The icon centre equals the button centre (0px offset on both axes). No extra size classes on the icon |
| Place | The last column, header cell empty, buttons right-aligned. The last button's right edge mirrors the table's left cell padding: 24px gutter in full-width `sm-table`s (measured gap 27 to 28), 12px in the compact tables of the project settings (measured 12) |
| Height | Vertically centred in the row (measured offset 0 to 0.5px) |
| Visibility | Shown at once, not on hover, so keyboard users reach them. Disabled (not hidden) while a request for the row runs; hidden only when the user has no right to the action |
| Order | Specific actions first, the destructive one last: share, check, delete (Access); reassign, revoke (Devices); check now, remove (Datasets); assign credentials, check now, delete (the projects of a repository) |
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
- Row actions on a parent or a dataset are icon buttons, shown at once (not on hover) so that keyboard users reach them: refresh (a spinner replaces the icon while it runs, success and failure are toasts) and remove (confirmed with `DatasetRemovalService`). Remove is shown to the owner and to admins only; refresh is hidden for a registry with no id. A repository dataset has **Check now** (`datasets.check`: can its repository be read with its credential) in the same place; the credential itself is assigned in the side panel, because three buttons do not fit the table at 1600px.
- The projects under a code repository (Repositories page) have three: **Assign credentials** (lock), **Check now** (refresh, `repositories.check`) and **Delete** (trash, `repositories.delete`, confirmed; shown to the project's owner and admins, `can_delete`). Delete takes the repository out of that project's list only: a run that uses it again lists it again.

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
- Repositories (`sm-project-repositories`) list the code repositories of the project: its runs named them, or its owner listed them. Columns are Repository, Access (the access badge: how the project's jobs read it) and Owner; the lock icon button assigns the credential (owner and admins). The header's **Add repository** button (owner) opens the repository dialog with the project fixed. A listed repository is usable by the project's jobs at once, whoever of the project's members queued them. Data: `repositories.get_all` with the project, `repositories.add`, `repositories.set_credential`.
- Queues revoke through `access.unshare` with the share's id: the owner, collaborators and admins see the action on a row with a share id. Adding queues stays owner-only.
