# Cards and containers

Existing: `sm-card-list-layout` (grid `repeat(auto-fit, 352px)`, gap 24px, padding `0 24px 24px`), entity cards (`project-card`, `experiment-card`, `model-card`, `plus-card`, `card`, `card2`), `table-card`, `editable-section`, expansion panels (4px radius). Card tones come from `--card-*` variables (`customizations/cards.scss`), with light and dark definitions.

## Use a card when

- The item is an **entity tile** in a grid the user scans visually (project, model, dataset collection) and the card can show a preview and 2-4 facts.
- The item is **interactive as a whole** (clicking opens it): the whole card is one link/button with a visible hover and focus state.

## Do not use a card when

- The content is a table row, a form section or a list of properties: put it on the page under a section title.
- You would put a card inside a card. Nesting is not allowed; use a divider (`1px --color-surface-container-high`) instead.
- Only to add a border around a single paragraph.

## Specification

| Property | Value |
|---|---|
| Radius | `--radius-md` 6px (`$card-border-radius`) |
| Border | 1px `--color-surface-container-high` (no shadow) |
| Background | `--color-surface-container-lowest` (light), `--color-surface-container-low` (dark) |
| Padding | `--space-4` (16px) |
| Title | 14px/500, one line, ellipsis + tooltip |
| Meta | 12px secondary text |
| Footer (optional) | 1px divider, 12px, actions as icon buttons or a menu |
| Grid | width 352px, gap 24px (`--space-5`), centered |
| Hover | border `--color-outline`; selected: 2px `--color-primary` ring |

## Container kinds

| Kind | Use |
|---|---|
| Summary card | 1-3 numbers with labels at the top of monitoring/overview pages, in a row with 16px gap |
| Grouped panel | Chart or log in a bordered panel on detail/monitoring pages |
| Configuration container | A form section: title, description, fields, no border |
| Editable section | Detail-page section with an edit toggle (existing `editable-section`) |
