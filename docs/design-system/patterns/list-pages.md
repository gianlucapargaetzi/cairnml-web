# List pages

Used for tasks, models, datasets, pipelines, queues, agents, endpoints.

## Structure

```text
Application header (64px; outside the page, see layout 3.1)
  Title block: name (16px/500) over where it is (12px)   [tabs, centred]   [⊕ symbol-only primary, tooltip "Create …"]  [secondary symbols]
Toolbar (48px, padding 0 24px, gap 8px)
  [Search 280px]  [Filter ▾] [Filter ▾]  [chips of active filters]   ····  [Columns ▾] [Refresh]
Bulk bar (replaces toolbar content while rows are selected): "3 selected"  [Archive] [Delete]  [Clear selection]
Table (fills, header sticky, rows 40px, virtual scroll)
```

## Rules

- Primary action creates the entity when the user can create it in the UI; otherwise omit it and explain in the empty state how entities appear (e.g. tasks are created by the SDK).
- Search is first in the toolbar, debounced 300 ms, clears with an icon button, state kept in the URL/store.
- Filters in a menu/panel; active filters visible as removable chips; "Clear filters" appears when any is active.
- Default sort stated and persisted per page.
- Counts: "128 tasks" or "12 of 128" under filters.
- Row click opens the detail page; the name cell is a real link (middle-click works).
- Bulk actions only for entities that support them; destructive ones confirm with the count.
- Card variant: replace the table with `sm-card-list-layout`; toolbar the same; a "Load more" button at the end of the grid.

## States

| State | Display |
|---|---|
| Loading first page | spinner in table area; header and toolbar visible |
| Refreshing | no spinner; update indicator in the toolbar |
| Empty | message + action ([feedback](../components/feedback.md)) |
| Filtered empty | "No tasks match the filters" + Clear filters |
| Error | inline error in the table area + Retry |

## List and detail panel (split view)

Used for the Datasets browser and the same shape fits any collection whose items have a long description. The table fills the left part, and a panel for the selected row fills the right part. The split is a resizable `as-split` (58% and 42% by default, the table can not go below 30%).

- The table is `sm-table` with the standard anatomy. Rows are selectable, and the first row is selected when the page opens. Clicking a row replaces the panel; the URL is not changed.
- The panel has a title (16px, weight 500) and a secondary line (the repository or the registry link). Below it, tabs (`mat-tab-group`, in-page): General, then Git graph when the item has a history.
- General uses `sm-section-header` per group (Dataset, Modalities, Splits, Labels, Description) and `sm-labeled-row` for the key-value rows. A missing value shows an empty-state note in secondary text that says what to do ("No manifest.json in this dataset yet ..."), not a dash alone.
- Git graph: one lane per branch line, a curved line from each commit to its parents, one dot per commit. The lane colours are the data palette (`presetColors`), the only colours of the graph; the text uses the theme tokens. The commit text is the message, then the short sha in monospace, then author and date, in secondary text.
- The panel scrolls inside its own container; the table does too. Nothing is shown in the panel until the selected item has loaded, and a load that fails shows the error in the panel, not an empty table.

