# List pages

Used for tasks, models, datasets, pipelines, queues, agents, endpoints.

## Structure

```text
Page header (56px)
  Title (16px/500) + count badge                      [Secondary action]  [Primary: Create …]
  Description (optional, 12px)
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
