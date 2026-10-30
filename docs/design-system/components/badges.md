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
