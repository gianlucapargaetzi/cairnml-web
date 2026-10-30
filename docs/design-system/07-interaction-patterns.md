# 07 Interaction patterns

## Pointer

| Interaction | Behaviour |
|---|---|
| Click on a row in a list | Opens the entity (navigates) — except on checkboxes, action buttons, links and tags, which stop propagation (`click-stop-propagation` directive exists) |
| Click on a card | Opens the entity; the whole card is one target |
| Hover | Subtle: row tint (4% mix), border darkens on cards, tooltip after 500 ms (`showDelay: 500` used by project cards) for icon buttons and truncated text. Hover never reveals the *only* way to do something |
| Double click | Not used for primary actions; inline rename uses an explicit edit icon (`sm-inline-edit`) |
| Right click | Optional context menu mirroring the row menu |
| Long text | Truncated with ellipsis; full text in tooltip and copy affordance |
| Drag and drop | Allowed for reordering and column resize (`angular-split`, `cdk`); always provide a non-drag alternative (menu "Move up/down", numeric field) |

## Keyboard

- Tab order follows visual order; no positive `tabindex`.
- Enter / Space activate buttons; Enter submits single-line forms; Esc closes dialogs, menus, popovers and cancels inline edit.
- Arrow keys move within menus, tabs, radio groups and selects (Material).
- Global shortcut: **Ctrl+K** opens search (shown in its tooltip). New global shortcuts need an entry here and a visible hint.
- Every clickable element is a `<button>` or `<a>`. Elements with `(click)` on `div`/`span`/`i` (38 in templates today) are migrated; if unavoidable they need `role`, `tabindex="0"` and `(keydown.enter)`.

## Focus

- Focus is always visible ([09-accessibility.md](09-accessibility.md)). The global `* { outline: none !important }` in `reboot.scss` is a defect that must be removed.
- After opening a dialog, focus moves inside; on close it returns to the trigger (Material default; keep it).
- After an in-page navigation (tab change) focus stays on the tab; after a delete, focus goes to the list heading.

## Selection

- Single-select lists/tables: click selects and opens. Multi-select tables: checkbox column; Shift+click ranges; selected rows highlight with `--color-primary`; a bulk action bar replaces the filter toolbar content or sits above it and states the count ("3 selected") and "Clear selection".
- Selection persists across background refreshes and is cleared by navigation, filter change and completion of a bulk action.

## Confirmation

See [dialogs](components/dialogs.md): confirm destructive, irreversible, costly or multi-user actions; never confirm reversible or read-only ones; prefer Undo toast where feasible.

## Form submission

See [forms](components/forms.md): Save disabled until dirty and valid; loading on the button; success shown inline; failure keeps input.

## Navigation

- A change of page or tab updates the URL; reload and the browser back/forward button restore the view (filters and sort should be in the URL or restored from stored state; the app uses stored state `_saved_state_` and route-based tabs).
- Links open in the same tab; external links (docs, repository) open in a new tab with `rel="noopener noreferrer"` and show an external-link hint.
- A 401 triggers sign-in; the app returns to the same URL (existing).

## Auto-refresh

Lists and detail pages that show changing state (running tasks, queues, agents) refresh in the background through the header refresh control. Refresh never moves the scroll position, closes menus, resets selection or discards edits. The header shows the refresh state.
