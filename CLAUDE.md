# UI guidelines for the CairnML web app (our fork)

Read this before adding or changing any page. The aim is that every page looks and behaves like the rest of the app. When a page needs something the app does not have, add it once to the shared components or the styles, then use it everywhere. Do not build a one-off in a page.

Stack: Angular 21 (standalone components, signals, `inject()`), Angular Material 21, NgRx, Heebo font, SCSS. Shared code lives in `src/app/webapp-common/`; our own features live in `src/app/features/`. Icons come from the `al-ico-*` font and the `i-*` SVG classes in `webapp-common/styles/icons.scss`.

## 1. Page layout

Every page sits inside the same shell, from the outside in:

1. **Side navbar** (`webapp-common/layout/side-navbar`). A fixed icon rail on the left. Items are `a.item` with an icon class (`al-ico-*`) and a `smTooltip`. The active item has `class.active`. New top-level features get one item here; do not add a second navigation system.
2. **Header** (`webapp-common/layout/header`). Full width, dark (`$header-backgroud`). Left: the feature title in capitals. Middle: the feature tabs. Right: search (`sm-search`), help, and the user menu (a round avatar).
3. **Feature tabs** (`webapp-common/layout/header-navbar-tabs`). A `mat-tab-group` centred in the header. Set it from the feature's route component with `headerActions.setTabs({contextMenu: TABS, active: feature})` and clear it on destroy with `headerActions.reset()` (see `features/workers-and-queues/orchestration.component.ts`). A tab may show a `counter` (a number with an icon) or a `subHeader`.
4. **Breadcrumbs** (`webapp-common/layout/breadcrumbs`). Only on sub-pages. Declare them in the route data: `data: {staticBreadcrumb: [[{name: 'WORKERS AND QUEUES', type: CrumbTypeEnum.Feature}]]}`. The first crumb is the feature, the rest are `CrumbTypeEnum.SubFeature`.
5. **Page content.** Inside a scrolling `.content` element with `padding-top: 24px` (see `orchestration.component.scss`). Horizontal padding is 24px (the layout's own padding, see `webapp-common/layout/layout.scss`). Sections are separated by 24px; related items by 8 to 16px.

Master and detail: use `as-split` (`angular-split`) with two areas, a list and a detail panel, a gutter of 1px, and the detail area `[visible]` only when something is selected. See `containers/workers/workers.component.html`. Call `table.afterTableInit()` on `transitionEnd`.

### How a new page should look

- A title is not repeated inside the page. The header already shows the feature name; the page shows its own content first.
- Lead with the data. A summary row of cards (counts, state) comes first, then detail below.
- Lists are tables, never ad-hoc `div` grids.
- Each page has at most one primary action (see Buttons). Put it at the top right of the section it belongs to.
- Empty states: one short sentence that says what to do next, muted (see the `empty` mixin in `webapp-common/styles/mixins/empty.scss`). Never a blank area.
- Loading: the shared spinner (`sm-spinner`) in the area being loaded, not a full-page blocker.
- Errors from the server go through the error service and show as an inline message or a dialog (`sm-operation-error-dialog`), not as a browser alert.

## 2. Components: what to use, and when

| Need | Use | Notes |
|---|---|---|
| A list of records | `sm-table` (sortable, filterable, selectable rows) | The default for every list. Every row needs a unique `id`: the table marks a row as selected by comparing ids, so rows without one all look selected. Columns are declared with `cols`, sorting with `tableSortFields` and `(sortedChanged)`. Use `sm-table-filter-sort`, `sm-table-filter-duration` and `sm-table-filter-duration-numeric` for column filters, so filters look the same everywhere. |
| A small fixed list (up to about 10 rows, no sorting) | `sm-simple-table-2` | For details panels, e.g. a worker's queues. |
| A panel or group of content | `sm-card` (or `sm-card2`) | Border, radius and padding from the card's own style. Do not hand-style a card. |
| Key number with a label | `sm-circle-counter`, `sm-labeled-row`, `sm-vertical-labeled-row` | Use labeled rows for read-only "name: value" pairs. |
| Status | `sm-circle-status` | One status vocabulary. See Colour. |
| Tags and labels | `sm-tag-list`, `sm-mini-tag`, `sm-mini-tags-list`, `sm-chips`, `sm-chips-list` | Tags are coloured by the tag colour menu (`sm-tag-color-menu`). |
| Search | `sm-search` | In the header for the global search, and above a list for local filters. |
| Filter groups | `sm-grouped-checked-filter-list`, `sm-selectable-grouped-filter-list`, `sm-checkbox-three-state-list` | Use these for filters with groups or checkboxes. |
| Toggle between views | `sm-button-toggle` | Two or three options. |
| Inline editing of a value | `sm-inline-edit`, `sm-editable-section` | For rename-in-place and editable blocks. |
| Confirmation before a destructive action | `sm-confirm-dialog` | Every delete, revoke and reset goes through it. |
| Any other dialog | `sm-dialog-template` | Title, body and actions in the standard layout. Wizard flows: `sm-wizard-dialog-step`. |
| Copyable value (ids, commands) | `sm-copy-clipboard` | |
| Code or JSON | `sm-code-editor`, `sm-edit-json` | |
| Expandable detail in a table | the table's row expansion | Do not invent an accordion. |
| Dividers | `sm-divider` | Only between two sections of the same card. |

Angular Material is used for the rest: `mat-tab-group`, `mat-menu`, `mat-form-field`, `mat-select`, `mat-checkbox`, `mat-slide-toggle`, `mat-tooltip` (through `smTooltip`).

## 3. Buttons

- **Primary**: `mat-flat-button` (the theme's primary colour). One per view; it is the action the page exists for (e.g. "New project", "Enqueue").
- **Secondary**: `mat-stroked-button`.
- **Tertiary, in a toolbar or row**: `mat-icon-button` with an `al-ico-*` icon and a `smTooltip` (used in about 90 templates). A text-only link action uses `mat-button`.
- **Destructive** (delete, revoke, reset): a button in the error colour, placed away from the others, and always confirmed with `sm-confirm-dialog`.
- Button labels are short verbs in sentence case, unless the app already uses capitals for that screen (the header tabs are capitals; buttons follow the page's existing style, so check the neighbours first).

## 4. Forms

- Use `mat-form-field` with the outline appearance (the app's default). Label above or inside the field according to the theme, never a custom label.
- Form actions: one row after the last field, right aligned. The primary action is the last button.
- Validation messages appear under the field, in the error colour.
- Dropdowns: `mat-select`. Autocomplete: `sm-select-autocomplete-with-chips` or `sm-select-autocomplete-for-template-forms`.

## 5. Colour

Use the variables in `webapp-common/styles/variables.scss` and the Material theme. Never write a hex value in a component.

- Backgrounds and surfaces: the blue-grey scale `$blue-25` to `$blue-950` (light surfaces to dark). The header is `$blue-900`; dark theme surfaces follow the theme files (`themes.scss`).
- Text: the theme's primary text colour; secondary text is the same colour at reduced opacity, not a new colour.
- Primary action: the Material primary palette (`cairnml-palette.scss`).
- Status: `$success-color` (active, healthy), `$error-color` (failed, revoked, down), `$pending-gray` / `$blue-300` (idle, pending), `$running-green` or `$turquoise` (running), `$orangada` (warning, attention). Use the same status name for the same meaning everywhere; a worker that is "running" is green in the table, the card and the chart.
- Light and dark themes must both work. Check both before you finish.

## 6. Typography

- Font: Heebo (`$font-family-base`).
- Sizes: `$font-size-small` (12px) for captions and table headers, `$font-size-regular` (14px) for body, `$font-size-lg` (1.25 rem) for section titles. Do not introduce other sizes.
- Table headers: small, uppercase, muted.
- Numbers in KPI cards are larger than the labels under them; the label is always the same muted style.

## 7. Spacing and layout helpers

- Use the utility classes in `webapp-common/styles/utilities.scss` (`mt-2`, `flex-grow-1`, `overflow-hidden` and similar) before writing new CSS.
- The rhythm is 24px between sections, 16px inside a card, 8px between related items. These are conventions of the existing pages, not variables.
- Use flexbox and CSS grid. Do not use absolute positioning for layout.
- Pages scroll inside `.content`; the header and side navbar never scroll.

## 8. Icons

- `al-ico-*` for the app's own icons (font), applied with `<i class="al-icon ...">` or a class on a `mat-icon`.
- `i-*` for the SVG icons defined in `icons.scss`. Check that the icon is defined there before you use it.
- Every icon-only control has a `smTooltip`.

## 9. Files and conventions

- A feature lives in `src/app/features/<feature>/`: `<feature>.routes.ts` (lazy routes with `loadComponent`), a page component, and its providers. Shared components go in `webapp-common`.
- A page component is a container: it selects from the store and dispatches actions. Presentational pieces are "dumb" components (`dumb/` folders) that take inputs and emit outputs.
- Use `inject()` and signals; no constructor injection in new code.
- New strings are short. Do not put long help text in a page; use a tooltip or a `sm-...` info block.

## 10. Before a page is done

- Looks right at desktop width and at about 1200px (the side navbar stays, the content reflows).
- Light and dark themes both checked.
- Every list is an `sm-table` with the standard filters and sorting.
- Every destructive action is confirmed.
- Empty, loading and error states exist and are short.
- No hex colours, no new fonts, no new sizes in component styles.
- The header tabs and breadcrumbs match the feature's other pages.
- `pnpm run build` passes.
