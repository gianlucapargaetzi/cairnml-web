# 08 UX guidelines

## 8.1 Page hierarchy

On arrival users must see in one glance: where they are (breadcrumbs + page title), what this is (title, optional description), what matters (status, key numbers), what they can do (action buttons in the page header). Important information is above the fold; advanced information is behind tabs or expanders.

## 8.2 Terminology (Standard labels)

Use one word per concept in labels, titles, tooltips, messages and documentation. Derived from the routes, API and navigation; items marked *decision* are inconsistent today and need one choice.

| Concept | Label | Avoid | Note |
|---|---|---|---|
| A unit of work with parameters, code, results | **Task** | Experiment, Run, Job | Routes use `tasks` and redirect from `experiments`; component and variable names still say "experiment" (internal names may stay). `Pipeline run` is a pipeline execution and keeps its name |
| Group of tasks | **Project** | Folder (except where folders are a real feature: `task-folders`) | Side-nav "Projects" opens the dashboard |
| Trained artifact | **Model** | | |
| Versioned data | **Dataset** / **Dataset version** | | Datasets are Git+DVC repositories in the SDK; the web shows "Dataset Versions" — fix capitalization to "Dataset versions" |
| Waiting list of tasks | **Queue** | | |
| A process that runs tasks | **Agent** | Worker | Decided: the UI says **Agent** everywhere (the page is called "Agents & Queues"). The API keeps its `workers.*` names; they are not user-facing |
| Served model | **Endpoint** | Serving | Route `endpoints`, page title "Active endpoints". Not in the side navigation until CairnML documents how to create endpoints (issue #13) |
| A computer enrolled to sign in | **Device** | Machine, client | Only exists in API/CLI today; use "device" in future UI and explain once as "a computer enrolled with CairnML" |
| Remove permanently | **Delete** | Remove (use for detaching), Destroy | |
| Make a task not shown by default | **Archive** | Hide | |
| Stop a running task | **Abort** | Kill, Cancel (Cancel is for dialogs) | Task status "Aborted"/"Stopped" must match the action |

Capitalization: sentence case ("Create queue"); proper product names as is (CairnML).

## 8.3 Information density

- Default: show identifier, name, status, last update, owner. Offer column selection for the rest (existing custom columns menu).
- Show relative times ("5 min ago") with the absolute time in a tooltip.
- Large numbers use thousands separators; durations use `1h 05m`; sizes use binary units with one decimal.
- Technical blobs (JSON, command lines, hashes) show truncated with copy and expand.

## 8.4 Self-explanatory UI

| Need | Tool |
|---|---|
| Name an icon | Tooltip |
| Explain a field | Helper text under the field (`mat-hint`) |
| Explain a concept once | One-line description under a section title |
| Link to deeper info | "Learn more" link to CairnML documentation (`docsLink` in `src/environments/base.ts` points to the CairnML repository README) |
| Guide first use | Empty-state text with the next step |
| Warn of consequences | The confirmation body |

Do not explain the interface with long paragraphs on working pages. Do not require knowledge of server internals (ids, queue names) without a picker.

## 8.5 Consistent workflows

| Workflow | Pattern |
|---|---|
| Create | Button in the list page header → dialog (≤ 5 fields) or page → on success navigate to the new entity |
| View | Click row → detail page with tabs |
| Edit | Inline for single values (`sm-inline-edit`); section edit toggle for groups (`editable-section`); form page for configuration |
| Delete | Row/overflow menu or detail header menu → confirm dialog → toast → return to list |
| Filter/search | Toolbar above the list; state kept in the URL/store; "Clear filters" |
| Archive/restore | Same placement and wording as delete, no confirmation needed for archive |
| Enqueue | Dialog with a queue picker (restored in the recent commits), result toast naming the queue, status updates to Queued |

## 8.6 Long-running operations (tasks, agents, endpoints)

The platform is mostly about things that take time. The state must be visible, honest and actionable.

| Element | Rule |
|---|---|
| State | `sm-status-icon-label`: Queued (waiting for an agent), Running, Completed, Failed, Aborted. **Queued never looks like Running or Completed** |
| Where | In the page header next to the title (detail), as a column (list) |
| Time | Show "Started 12 min ago · running 12 min" for running; "waited 3 min in <queue>" for queued; last update timestamp for monitoring views |
| Progress | Show only if the server provides it (iteration, percentage): progress bar or "iteration 1200/5000". No fake progress |
| Logs | Console tab streams new lines, auto-scrolls unless the user scrolled up, offers "Jump to latest", timestamps toggle, copy and download |
| Failure | Failed status + the status message from the server at the top of the detail page ("Task failed: <message>") + link to console; no stack traces in toasts |
| Cancel | "Abort" in the header menu with a confirmation that says what is kept ("The task will stop. Results so far are kept.") |
| Retry | "Clone" / "Reset and enqueue" (existing operations) offered next to a failed task; wording explains whether results are kept |
| Disconnected agent | When the agent stops reporting, show "No update for N min" (derive from last update), not a stale "Running" |
| Background refresh | Update status without a page loader; toast only for state changes the user caused |

## 8.7 Error handling

Distinguish: validation (inline), network (retry), permission (explain), missing resource (not found), backend failure (reference + retry), unexpected (error boundary). Never display raw server messages that contain internals; show a request reference to quote to an administrator. See [feedback](components/feedback.md).

## 8.8 Success feedback

An action is successful only when the server confirmed it. For asynchronous operations, say what was accepted: "Task enqueued in 'default'" (not "Task running"). State changes that later complete are shown by the status, not by a second toast.
