# 06 Component guidelines: which component for which job

Use this table first. Detailed rules are in `components/`. "Std" = the component to use. Anything not in this table: ask "is there an existing component?" ([README](README.md)).

| I need to… | Use (Std) | Do not use | Details |
|---|---|---|---|
| Start the main action of a page or dialog | `button mat-flat-button` (one per view) | a second filled button next to it | [buttons](components/buttons.md) |
| Offer an alternative action | `button mat-stroked-button` | filled | |
| Offer a low-emphasis action (toolbar, "Show more") | `button mat-button` | | |
| Do something with an icon only | `button mat-icon-button` + `aria-label` + tooltip | `<i>`/`<div>` with `(click)` | |
| Delete / terminate / irreversible | filled `delete-button` inside a confirm dialog | the primary style | [dialogs](components/dialogs.md) |
| Ask for text | `mat-form-field` outlined + `matInput` | raw `<input>` | [forms](components/forms.md) |
| Choose 1 of ≤ 4 visible options | `mat-radio-group` | select | |
| Choose 1 of > 4 options | `mat-select`; with search: autocomplete | radio | |
| Choose several of many | autocomplete with chips (`select-autocomplete-with-chips`) | | |
| Toggle a setting that applies immediately | `mat-slide-toggle` | checkbox | |
| Select options in a form / acknowledge | `mat-checkbox` | switch | |
| Show many comparable records | `sm-table` | cards | [tables](components/tables.md) |
| Show a few entities as visual tiles | `sm-card-list-layout` with entity cards | table | [cards](components/cards.md) |
| Show one record's properties | key-value rows: `sm-labeled-row` / `sm-vertical-labeled-row` | table | |
| Group form fields | a titled section on the page | a card around every group | |
| Confirm an action | `ConfirmDialogComponent` (67 uses) | custom dialog | [dialogs](components/dialogs.md) |
| Collect ≤ 5 fields | dialog `dialog-md` (640px) | | |
| Collect many fields or multi-step | a page, or `wizard-dialog-step` for ≤ 3 steps | | |
| Show a status | `sm-status-icon-label` | colored text | [badges](components/badges.md) |
| Label an entity | `sm-tag-list` (user tags) | status color | |
| Show short result of an action | toast: `addMessage(MESSAGES_SEVERITY.*)` | dialog | [feedback](components/feedback.md) |
| Show an error tied to a field | `mat-error` | toast | |
| Show a problem that stays | inline alert / banner (see feedback) | toast that disappears | |
| Show loading of one area | `mat-progress-spinner` / `mat-spinner` in that area | global `sm-spinner` | |
| Switch between views of the same entity | `mat-tab-nav-bar` (routes) / `mat-tab-group` | buttons that look like tabs | [navigation](components/navigation.md) |
| Give more actions on a row or item | `mat-menu` opened by an icon button | hover-only icons | |
| Explain an icon | tooltip (`smTooltip`) | native `title` | |
| Copy an identifier | `sm-copy-clipboard` | | |
| Empty list | empty-state mixin (`empty-card-mixin` / `table-empty-message`) | blank area | [feedback](components/feedback.md) |
| Choose a date / duration | Material date adapter / `sm-duration-input` | free text | |
| Edit code / JSON | `sm-code-editor` / `edit-json` dialog | textarea | |

## Component libraries in use

| Library | Role | Rule |
|---|---|---|
| Angular Material 21 (Material 3) | Buttons, form fields, menus, dialogs, tabs, checkbox, radio, toggle, tooltip, chips, progress | Default choice. Customised only through `styles/customizations/*.scss`, using the library's own override mixins/variables (e.g. `mat.button-overrides`) |
| PrimeNG 21 (`primeng`, preset `prime.preset.ts`) | `p-table` virtual-scroll data table (3 templates) and slider | Do not add other PrimeNG components. New tables use the existing table components |
| Bootstrap 5 (reboot, helpers, utilities) | Resets, grid helpers, spacing utilities | Do not use Bootstrap's spacing utilities in new code (rem = 14px, see tokens). Flex/display helpers are acceptable until replaced |
| Custom icon font `al` | All icons | See [icons](components/icons.md) |

Adding another UI library is not allowed without a documented reason in this directory.
