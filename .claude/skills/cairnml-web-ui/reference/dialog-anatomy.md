# Dialog anatomy (measured)

Measured from 45 dialogs opened by `scripts/crawl.js ... dialogs` (1600x900).

| Class | Width | Use |
|---|---|---|
| `dialog-sm` | 430 | one choice: add queue, add dataset to a project, add credential, add user |
| `dialog-md` | 640 | one small form: new project, new report, add dataset, add repository, resource help |
| `dialog-lg` | 768 | multi-section form or wizard: project settings, new task |
| `dialog-xl` | 1024 | search |
| `dialog-xxl` | ~1200 | long help with code samples (About datasets) |

Structure of `sm-dialog-template`: icon (20px) centred at the top, title centred below it (sentence case, blue), muted one-paragraph note, the form column (fields 8px apart via `--space-2`), the error line, the action row, close button top-right.

Rules:
1. **Close button: one size.** The template's grey circle, **36px**, in every dialog. Beware of a measurement artifact: a dialog measured while it opens (or while the machine is busy) is scaled to 0.8, so the close button reads 28.8px. Wait until the overlay stops moving before measuring (`crawl.js` does).
2. **Action row: centred, Cancel first (`mat-stroked-button`), the action second (`mat-flat-button`), 16px apart.** A dialog that only informs has only the close button. A dialog with a single create action still has Cancel.
3. **The action label is the verb plus the thing, never "Apply":** "Add dataset", "Add queue", "Add member", "Add credential", "Create project", "Create report"; "Save" only when editing an existing thing. Create dialogs have Cancel too. The New task wizard (Next, Save as draft, Run) is the one exception: it is a multi-step flow.
4. **One purpose per dialog.** Help, code samples and documentation go behind a `?` button (a separate dialog), not into the action dialog as tabs.
5. Fields are `mat-form-field` outline, full width; hints under the field, 12px, muted.
6. Disabled action until the form is valid; a spinner (20px) inside the action while saving; errors in the error line, never `alert()`.
7. Use the shared mixin `styles/mixins/dialog-form.scss` (`dialog-form()`, `option-meta()`).

Check by opening each dialog from its real button with Playwright, screenshotting it, and reading `close.w`, the button row and `paneClass` from `audit.json`.
