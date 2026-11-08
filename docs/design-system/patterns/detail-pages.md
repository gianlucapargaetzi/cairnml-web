# Detail pages

Used for one task, model, pipeline run, dataset version, endpoint.

## Structure

```text
Application header (64px): line 1 task name (16px/500), line 2 Projects / Project / Task list     [tabs, centred]     [symbol-only actions]
Panel header (sm-panel-header, in place)
  [←?]  Task name (16px/500, inline-editable)  [Status]          [Secondary…]  [Primary]  [⋮ menu]
  metadata line (12px, secondary): id (copy) · created by · created 5 d ago · last update 2 min ago · queue
Tabs (route based): General · Execution · Artifacts · Hyper-parameters · Scalars · Plots · Debug samples · Console
Tab content (scrolls): sections with 32px gaps; key-value rows; tables; charts
```

Tab names come from the routes of the task page (`general`, `execution`, `artifacts`, `hyper-params`, `scalars`, `plots`, `debugImages`, `log`). Labels: sentence case, plural nouns, "Console" for `log`.

## Rules

- **Status next to the title**, always visible, plus elapsed/last update in the metadata line.
- **Actions:** primary = the next logical step for the current status (Draft → "Enqueue" primary; Queued → "Dequeue" secondary; Running → "Abort" secondary, no primary; Completed/Failed → "Clone" primary). Everything else in the ⋮ menu. Destructive items last, separated by a divider, in `--color-error`.
- **Metadata:** key-value rows with `sm-labeled-row`: label 12px secondary, value 14px; ids monospace with copy.
- **Related resources:** links to the project, the queue, the agent, input/output models, parent task. Every id displayed as a link to its entity.
- **Ownership (queue detail):** the first row is `Owner` (`sm-labeled-row`): the owner's name, or the id when the name is not resolved. An entity without an owner (created before ownership existed) shows "Admins". Owner-only sections (grants) are tabs that only the owner and admins see; other viewers do not see the tab at all. Allocations to projects are a tab every viewer sees.
- **Activity/history:** operations log and status history as a tab or section, newest first, with timestamps and the user.
- **Editing:** inline edit for name, description and tags; section edit for execution and hyper-parameters; read-only when the status forbids it (explain why in a tooltip).
- **Tabs keep their own scroll position and are reachable by URL.**
- Not found: show the not-found state inside the shell, with a link back to the list.
