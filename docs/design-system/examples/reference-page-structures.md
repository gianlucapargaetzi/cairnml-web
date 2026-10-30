# Reference page structures

Each example uses functionality that exists in the app (names from routes and components). Sizes in px.

## Example A: Standard list page: Tasks in a project

```text
┌ App header (64): Workspace › Project ›                                   [⌕] [↻] [?] (avatar) ┐
├ Page header (56)  Tasks  [128]                              [Compare]  [Archive]  ┤
│ Toolbar (48)  [⌕ Search tasks…   ]  [Status ▾] [Tags ▾] [User ▾]   ·····  [Columns ▾] │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ☐  Name              Status        Updated       Type      Queue     ⋮                  │ header 40
│ ☐  train-v3          ● Running     2 min ago     training  default   ⋮                  │ row 40
│ ☐  eval-v3           ○ Queued      5 min ago     testing   gpu       ⋮                  │
│ ☐  prep-data         ✓ Completed   1 h ago       data      —         ⋮                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
Empty:    icon · "No tasks yet" · "Create a task by calling Task.init in your script, or clone an existing one."
Loading:  spinner centered in the table area; toolbar visible
Error:    "Could not load tasks. Check your connection." [Retry]
```
- Primary action: none in the header because tasks are created by the SDK; "Compare" appears enabled when ≥ 2 rows are selected (secondary).
- Pagination: virtual scroll; count in the title.

## Example B: Detail page: Task

```text
Breadcrumbs: Workspace › Project › train-v3
┌ Page header (56)  train-v3 ✎   ● Running · 12 min         [Clone]  [Abort]  [⋮] ┐
│ id 4f2a… ⧉ · created by anna · 3 h ago · queue default · agent gpu-01             │
├ Tabs:  General · Execution · Artifacts · Hyper-parameters · Scalars · Plots · Debug samples · Console ┤
│ Content (24 padding)                                                                │
│  Section "Description"                                                             │
│  Section "Input models" / "Output models"  (links to model pages)                  │
│  Section "Activity" (operations log, newest first)                                 │
```
- Status beside the title. While running there is no filled button: "Abort" is an outlined (secondary) button that opens a confirmation (Example D pattern), "Clone" is outlined too. A page may have zero primary buttons.

## Example C: Configuration form: Storage credentials

```text
┌ Page header (56)  [←]  Google storage credentials              [Reset changes]  [Save] ┐
│ Content (max 720, left)                                                               │
│   Credentials                          14/500                                          │
│   Service account JSON used to delete artifacts…   12 secondary                        │
│   [ outlined textarea …………………………………… ]                                            │
│   — 32 —                                                                              │
│   Buckets                                                                             │
│   [ Bucket name ]  [ … ]                 16 gap (fields as in the existing form)                                       │
│   [ + Add bucket ]  (tertiary)                                                        │
```
- Reset and Save disabled while pristine; Save shows spinner then check.

## Example D: Destructive confirmation (existing `ConfirmDialog`)

```text
┌─────────────────────────── dialog-sm (430) ───────────────────────────┐
│                         ⚠ (48, error color)                             │
│                       Clear queue "default"?                            │
│   Removes all queued tasks from this queue. The tasks themselves are    │
│   not deleted. This cannot be undone.   (confirm text with API behaviour)│
│                    [ Cancel ]   [ Clear queue ]  ← destructive filled    │
└─────────────────────────────────────────────────────────────────────────┘
```
Title names action and object; body states the consequence and whether data is lost; primary label repeats the verb; focus on Cancel.

## Example E: Long-running task

```text
Header:  train-v3   ● Running · 12 min 40 s            [Clone] [Abort]
Meta:    started 10:32 · agent gpu-01 · last update 10 s ago · iteration 1200/5000 (24 %)  [▓▓░░░░░░]
Tabs:    …  Scalars · Plots · Console
Console: stream with timestamps toggle · [Jump to latest] · [Copy] [Download]
Failure: header shows ● Failed + banner "Task failed: <status message from the server>" [View console] [Clone]
Queued:  header shows ○ Queued · "waiting 3 min in 'gpu'" [Dequeue]
No update: "No update for 6 min — the agent may have stopped" (warning icon)
```
Never show "Running" for a queued task; progress only when the API provides iteration data; Abort asks for confirmation.
