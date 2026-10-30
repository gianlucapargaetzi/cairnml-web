# Feedback: toasts, alerts, loading, empty states

## Which one

| Situation | Use | Duration |
|---|---|---|
| Short confirmation after an operation that is not visible elsewhere ("Task enqueued", "Link copied") | Toast, severity success | 5 s (existing `autoHide.default: 5000`) |
| Warning the user should read but is not blocking | Toast, warn | 5 s |
| Operation failed | Toast, error, **stays until dismissed** (existing `autoHide.error: false`) plus the reason | until closed |
| Problem tied to one field | `mat-error` under the field | persistent |
| Problem with a whole form or area that persists | Inline alert at the top of that area (to be created from the toast styling: icon 20px, 14px text, `--color-error`/`--color-warning` icon, 1px border) | persistent |
| System-wide state (update available, server unavailable) | Banner above the app (existing `sm-update-notifier`, 30px) | until resolved |
| First use / no data | Empty state | |
| Waiting for data | Loading indicator | |

Toasts are fired with `addMessage(MESSAGES_SEVERITY.SUCCESS | WARN | ERROR, text)`. At the time of writing there were ERROR 27, SUCCESS 25 and WARN 15 call sites. Do not call the notifier service directly (one direct `notifierService.show` exists; migrate it). Toast text: one sentence, 12px (existing), 380px wide, no stack traces.

## Writing messages

- Success: past tense, names the object: "Task 'train-v3' enqueued".
- Error: what happened + what to do: "Could not save credentials: the server did not respond. Check your connection and try again."
- Do not show internal ids, SQL/Mongo/ES messages, stack traces. Map known server errors to readable text; unknown ones: "Something went wrong (reference: <request id>). Try again or contact your administrator."
- Never say "Success" before the server answered.

## Loading

| Case | Indicator |
|---|---|
| First load of a page | Centered `mat-spinner` (24-32px) in the content area; the header and tabs render immediately |
| Table/list refresh | No spinner; keep old data; update timestamp |
| Button action | Spinner inside the button |
| Dialog loading content | Spinner centered in the dialog body; actions disabled |
| Blocking global operation (rare) | The global `sm-spinner` overlay; use only when the whole UI must wait |
| Long operation with progress | `mat-progress-bar` with percentage |
| Skeletons | not used in this app; do not introduce |

## Empty states

Mixins exist in `styles/mixins/empty.scss`. Structure: icon (48px, `--color-empty-state`), title (16px/500), one explanatory sentence (14px, `--color-on-surface`), optional primary action. Title says what is missing ("No tasks yet"); the sentence says how to fill it ("Run a script that calls Task.init, or clone an existing task"); the action does it when the user can. Never leave a blank area. Empty because of filters is a different message with "Clear filters".

## Error states (page level)

| Type | Message | Action |
|---|---|---|
| Network / server unavailable | "Cannot reach the server" | Retry; auto-retry with back-off for polling views |
| 401 | Session expired → sign-in redirect (existing) | |
| 403 | "You don't have access to this" | Back to list |
| 404 | `not-found` page (existing) / "This task no longer exists" in-page | Link to list |
| 5xx | "The server could not complete the request" + reference | Retry |
| Unexpected exception | Error boundary: "Something went wrong" + Reload (an error boundary does not exist yet) | Reload |
