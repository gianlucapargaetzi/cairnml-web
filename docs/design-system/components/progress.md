# Task progress (`sm-task-progress`)

A running task that reports its progress shows it wherever the task is shown. One component draws it, in two forms:
`ui-components/data/task-progress`. It shows nothing unless the task is running, so it is always safe to place next to a
status.

## Forms

| Form | Where | What |
|---|---|---|
| `mini` | Status cells: the task list, the card list, dashboard recent tasks, project overview, compare header, agents table | Next to the status label: a 64px x 6px bar and the percentage. On a selected (blue) card the bar and number are light |
| `full` | The detail panel of a task, under the header; the agent's "Current Task" | One thin bar per level, the outermost first (6px) and each bar inside it (3px). Each has its text centred in front of it (a frosted label: semi-transparent surface colour with a slight blur, so the bar shows through): "epochs · 3 / 8 · 41%" and "epoch 4 · 23 / 80" (smaller, muted) |

In the detail panel the status strip at the top of the panel is also the bar: it fills up to the percentage (solid). There is no line along a row or card and no ring: the small bar is the one way a list shows progress.

## Look

- **Striped:** the small bar of a list is slightly striped and the stripes move, so that it reads as "still running" (faint,
  `--progress-stripe-strength` 12%, 8px). Reduced motion: the stripes stand still. The bars of the detail panel and its
  status strip are solid: stripes on thick bars looked wrong.
- **Idle:** a running task that has nothing to count right now shows a segment sliding along the bar (40% of its width,
  1.2 s; 3 s for reduced motion) instead of a fill, with no percentage; the `full` form says "Working…". That is a run that reports
  no progress, one that is outside the bar that counts (loading data before the pinned `epochs`), or one after its last
  loop (saving the model). The SDK reports this explicitly (no bars), so a bar never stays frozen at its last value.
- Both come from the shared mixin `styles/mixins/progress.scss` (`fill`, `idle`, `keyframes`). Do not copy them.

## Behaviour

- The value moves smoothly: the fill slides to each new value over 2 s (`transition: width 2s linear`; none for
  `prefers-reduced-motion`).
- The values come from `TaskProgressService`. Every instance watches its task; the service asks the server for all
  watched tasks at once (`tasks.get_progress`) every 2 s, only while the page is visible. Until the first answer, and
  for tasks that are not reporting, the value stored with the task (`runtime.progress`, `runtime.progress_label`) is
  used.
- Nothing for a task that is not running. A running task that has not reported (or no longer has a bar that counts) is idle.
- Colours are tokens only; the bar has `role="progressbar"` with `aria-valuenow`.

## Do not

- Do not poll for progress in a component: use `TaskProgressService.watch`.
- Do not show progress for a task that is not running, and do not leave a bar at its last value when nothing counts: use idle.
- Do not draw a second kind of bar for a task: add a form here.
