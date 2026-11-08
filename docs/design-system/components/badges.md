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

## Counters (`circle-counter`, `number-counter`)

Only for counts attached to a tab or a nav item. 11-12px, `--color-primary-container` background, pill radius.

## Active/inactive

For enabled/disabled entities use text "Active"/"Disabled" with the status component (`active` status exists). Do not invent a toggle-looking badge.

## Repository access (`sm-repo-access-badge`)

How a project reads a repository, shown next to it in a task's source section, on a dataset and in the Repositories tab: "Read with <credential>" (a credential is assigned), "None needed", "No credential assigned" (the host allows a read without one), "Auto-Authenticated via Company Github App" (nothing is assigned and the company's access reads it: the warning colour and an alert icon, tooltip "Auto-Authenticated via Company Github App. Assigning credentials is recommended"), or "Access refused". It is an icon and a label, never colour alone: an open padlock when no credential is needed or assigned, a closed padlock for an assigned credential, an alert for the warning and for refused. The colours are the status tokens (`--color-warning`, `--color-failed`), and the reason is in the tooltip. "None needed" is the label for a repository that needs no credential: never "Public", which in CairnML is a company-wide visibility. Input: `access` (the result of `RepoAccessService.resolve`).

## Repository rows and the dispatch warning

The Repositories tab lists each repository once (`sm-table` with `expandableRows`); the row opens into one line per project that uses it: project, owner, the badge above, and, for the user who may assign (the project's owner, the user who first used the repository there, an admin), a lock icon button "Assign credentials" that opens `sm-dataset-credential-dialog`. Before a dispatch (task menu Enqueue, the New task wizard, pipelines), `DispatchGuardService.confirm` asks the server what the tasks' repositories need; a repository with nothing assigned that the company's access does not reach opens `sm-dispatch-warning-dialog`: for a public one "Assign credentials" and "Run anyway" (with "Don't ask again: mark these as None needed"), for a private one only "Assign credentials". A repository the company's access reaches gets no dialog, only the warning badge.
