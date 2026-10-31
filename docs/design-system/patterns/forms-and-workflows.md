# Forms and workflows

## Create flow

1. Entry point: primary button in the list page header ("Create queue").
2. ≤ 5 fields: `dialog-md` with title "Create queue", fields, `Cancel` + `Create`. Validation inline; `Create` disabled until valid.
3. > 5 fields or follow-up work: a configuration page, then navigate to the created entity.
4. Success: close dialog, navigate to the entity (or highlight the new row), toast only if the user stays on the list ("Queue 'gpu' created").

## Edit flow

Inline edit for a single value (Enter saves, Esc cancels); section edit toggle for groups; page form for configuration. Always show who/when changed on detail pages when the API provides it.

## Delete flow

Menu item "Delete" (no ellipsis, see [navigation rules](../components/navigation.md)) → confirm dialog (title with object, consequence text, `Cancel` + destructive `Delete`) → on success toast "Task deleted", return to list. For bulk: count in the title.

## Enqueue flow (task → queue)

Entry: "Enqueue" in the task header or bulk bar → dialog `dialog-md` with a queue picker (default last used), optional run settings → `Enqueue` → toast "Enqueued in 'default'" → task status shows Queued with the queue name and waiting time.

## Search/filter flow

Search box in the toolbar, filters in a menu, chips for active filters, a visible "Clear filters"; results update as the user types (debounced); URL/store keeps state.

## View execution results

List → click task → Console (log) and Scalars; status and failure reason in the header; compare action from the list (select 2+ → Compare).

## Wizard (≤ 3 steps)

`wizard-dialog-step`: step indicator, Back/Next, primary on the last step is the action. More than 3 steps means a page.
