# Badges, status indicators and tags

## Status: `sm-status-icon-label`

One component for every task/model/pipeline/endpoint status. Layout: 14px icon + 6px gap + label (70px wide, ellipsis), optional 18px progress spinner. Colors from [05-color-system.md](../05-color-system.md). Statuses with labels (EXPERIMENTS_STATUS_LABELS): draft, queued, running, completed, stopped, aborted, failed, published, and for endpoints/uploads: active, available, routing, uploading, final.

| Rule | |
|---|---|
| Always icon + label | Color is never the only signal; `showLabel=false` (icon only) requires a tooltip with the label and `aria-label` |
| Never restyle | Do not color text or backgrounds by hand for status |
| Mapping | Do not invent statuses in the UI; use the server's status values. Unknown status → neutral `--color-draft` + the raw value in titlecase |
| Running | Spinner/animated icon only while the server reports `in_progress`; elapsed time next to it on detail pages |
| Queued vs Draft | Distinct colors (see color system known deviation) |
| Stopped/Aborted | Label must say so; blue is shared with "Completed" so the icon differs |

## Tags (`sm-tag-list`, `sm-user-tag`, system tags)

Tags classify; they are not statuses. Chip height 18px (`--sys-tag-height`), radius `--radius-lg`, 12px/500, background = tag color at 10% (`$chip-bg-opacity`), text = tag color or `--color-on-surface`. User tags can be colored (`tag-color-menu`); system tags (e.g. archived) use the neutral container tone. Maximum 3 visible tags in a row, then "+N" with a tooltip.

## References to things in the app (`sm-entity-chip`)

Whenever a table, list or dialog *refers to* something that lives inside CairnML (a project, a dataset, a queue, a credential, a task), it is shown as an entity chip, never as plain text or a bare blue link. The chip is for a reference, not for the thing's own row: the Name column of a list of datasets, queues or credentials is plain text, because that is where the thing resides; the "Shared with" column of a credential, the projects of a repository or the tasks that ran a dataset hold references, so they get chips. A chip is a 24px tag-like pill: a 16px icon in `--color-primary`, the name in the surrounding text size, `--color-primary-container` background and a 1px border mixed from it, radius 4px. With `link` it opens what it names (hover: primary border and name); with `removable` it carries a small remove button inside (used for "Stop sharing"). Long names truncate with a tooltip.

| Names a | Icon | Link |
|---|---|---|
| Project | `al-ico-projects` (the default) | `['/projects', id, 'overview']` |
| Dataset | `al-ico-datasets` | `['/datasets']` with `queryParams {dataset: name}` (the dataset browser opens it) |
| Queue | `al-ico-queues` | `['/workers-and-queues', 'queues']` with `queryParams {id}` |
| Credential | `al-ico-lock` | `['/settings', 'access']` |
| Task | `al-ico-experiment-view` | `['/projects', projectId, 'tasks', taskId]` |

Rules: one chip per thing, several in a row with 8px between them; a table cell that can hold many shows the first plus a grey "+N" with a tooltip. Do not use a chip for people (owners, members: there is no page to open), for external things such as a GitHub repository (they keep their own display), or for a status (use the status component). A chip inherits the font size of its place: do not set a smaller one. The component sets its own icon size with a selector that beats the global `mat-icon` rule, so do not size the icon from outside.

## Counters (`circle-counter`, `number-counter`)

Only for counts attached to a tab or a nav item. 11-12px, `--color-primary-container` background, pill radius.

## Active/inactive

For enabled/disabled entities use text "Active"/"Disabled" with the status component (`active` status exists). Do not invent a toggle-looking badge.

## Repository access (`sm-repo-access-badge`)

How the signed-in user reads a repository (a code repository, a dataset or a registry), by the credential assigned to *them*, shown next to the repository in a task's source section, in the Repositories & Datasets list and in project settings. The icon says whether it is **readable**, the label says how:

| State | Icon | Colour | Label |
|---|---|---|---|
| A credential is assigned, "None needed", or the host allows a read without one (a public GitHub repository too) | `al-ico-lock-open` | `--color-success` (green) | "Read with <credential>", "None needed", "No credential assigned" |
| Nothing is assigned and the company's access reads it | `al-ico-alert` | `--color-warning` | "Auto-Authenticated via Company Github App" (tooltip: assigning a credential is recommended) |
| The host could not be asked | `al-ico-lock-open` | neutral | "No credential assigned" |
| Nothing reads it | `al-ico-lock` | `--color-failed` (red) | "Access refused" (the reason is in the tooltip) |

The open green lock and the closed red lock are the only two readability symbols: **a missing credential is not a missing access** (a public repository needs none), so the badge, the Access column and the credentials table all show readability, never "has a credential". It is an icon and a label, never colour alone. In a table cell use `[iconOnly]="true"`: the label becomes the tooltip and the accessible name. "None needed" is the label for a repository that needs no credential: never "Public", which in CairnML is a company-wide visibility. Input: `access`.

## Repository visibility

Whether a record is **shared** (owned by the admin, visible to every user, read with a company credential) or **not shared** (listed by a user, passed on through the projects it is used in) is a property of the record, shown in its own column **Visibility** as an icon only: `al-ico-users` (several people) for shared, `al-ico-account` (one person) for not shared, with the words in the tooltip. It is never mixed with the access lock, and it is not shown in the credentials table (it is the record's property, not the credential's).

## Repository rows, credentials and the dispatch warning

The Repositories & Datasets list has one row per record (`sm-table`; a registry opens into its datasets): Name, ID (the first 8 characters of the unique id, monospace, the full id as a tooltip), Type, Added by (the user who listed it, "Company" when shared: a record has a creator, the credentials and the projects are what users own), Visibility, Access, Last used and the row actions. The side panel shows the record and a **Credentials** `sm-table`: one row per credential in use (App, Owner, Access, Project, Last used, row actions on the user's own row only). The projects are entity chips *in that table* (removable by their members); there is no separate Projects list. Projects whose owner has no credential assigned are **one** "empty" row (App "–", all their projects, owners joined), with the open green lock when they read without one, the closed red lock when they cannot; two rows when they read differently. Before a dispatch (task menu Enqueue, the New task wizard, pipelines), `DispatchGuardService.confirm` asks the server what the tasks' repositories need; one nobody's credential and no company access reaches opens `sm-dispatch-warning-dialog` ("Assign credentials", plus "Run anyway" for a public one). A repository the company's access reads gets no dialog, only the warning badge.
