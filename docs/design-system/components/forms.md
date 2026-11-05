# Forms and inputs

Implementation: Material outlined form fields customised in `styles/customizations/form-fields.scss`: 36px container, 12px label that floats **above** the field, 12px helper/error text, 1px outline (`--color-outline-variant`, hover `--color-outline`), placeholder `--color-outline`. Reactive forms are the target; template-driven forms with the custom validators in `ui-components/template-forms-ui` exist and remain valid for small dialogs.

## Control choice

| Need | Control |
|---|---|
| Short text | `mat-form-field` + `matInput` (260 form fields today) |
| Long text | `matInput` textarea (min height 36px, resizable vertically only: `.resize-none` otherwise) |
| 1 of ≤ 4 options, all visible | `mat-radio-group` (32) |
| 1 of > 4 options | `mat-select` (22) |
| Many options, searchable | autocomplete (`select-autocomplete-*`) |
| Several values | autocomplete with chips |
| Immediate on/off setting | `mat-slide-toggle` (30). It saves on change, never waits for a Save button |
| Option inside a form / acknowledgement | `mat-checkbox` (59) |
| Search | `sm-search` (debounced; clear button) |
| Duration | `sm-duration-input` |
| Code or JSON | `sm-code-editor` / edit-JSON dialog |
| File | a button that opens the file picker plus the file name; drag-and-drop is optional |

## Sharing control (`sm-share-control`)

Shares one resource (queue, dataset, registry or credential) with projects, with every company user, or keeps it to its owner. Implementation: `ui-components/inputs/share-control`. It takes `resourceType` and `resourceId`, loads `access.list` and `user_access.get_all` (the projects the user owns or is a member of), and applies each change at once through `access.share` and `access.unshare`.

- **Who sees it:** only users who may manage the sharing of the resource (the `manage_sharing` action: collaborator level, or owner, or admin). The server refuses `access.list` to everyone else, and the control then renders nothing. Other users see no sharing section at all.
- **Scope:** `Only me`, `Projects`, `Public`, as a radio group (3 options). `Only me` is the absence of shares and has no action; stop the shares to return to it.
- **Level:** shown only for Projects, as a radio group of the levels the type has: queue and dataset Read, Read/Write, Collaborator; registry and credential Read, Collaborator. Public is always Read, so no level is shown for it.
- **Projects:** a checkbox per project that does not hold a share yet (one share record per project). Share creates one share per checked project.
- **Stop sharing:** a row icon button opens a destructive confirmation (`dialog-sm`) that states who loses access. Owners and collaborators of the resource may stop any share on it.
- **Inherited shares** (added by a task run) are listed with "(added by a task run)" and stopped the same way.
- Terminology: "Projects", "Public", "Only me" and the level names are the words in the access model. A share to one user (queues only) shows the user id, because the server returns no name for it (open item).

## Layout and spacing

- Label above the field (Material floating label, custom-positioned). Do not build your own labels except in key-value displays.
- One column up to 720px wide; fields full width of the column. Two fields share a row only when they are tightly related (from/to, host/port); the row gap is 16px.
- 16px between fields, 32px between titled sections. Section title 14px/500; optional one-line description below it in secondary text (12px).
- Helper text: a short sentence under the field using `mat-hint` (0 uses today, so help text is currently written ad hoc: **target** `mat-hint`). Do not repeat the label.

## Required, validation, errors

- Mark required fields with the `required` attribute (Material shows the asterisk). Mark optional fields only when most fields are required: "(optional)" in the label.
- Validate on blur and on submit; show `mat-error` (64 uses) under the field in `--color-error`; the message states the fix: "Name must be unique in this project", not "Invalid".
- Never rely on color alone: error messages are text, and the field gets `aria-invalid` (Material does this).
- Server-side errors that belong to one field are set on that control; others go to a toast or an inline alert at the top of the form.
- Disabled fields are used only when the value is shown but cannot be edited; add a hint why.

## Submission

1. Enter submits the form when focus is in a single-line input.
2. Save is disabled until the form is **dirty and valid** (existing pattern); the disabled reason is clear from the page (invalid fields show errors).
3. While saving: button loading state ([buttons](buttons.md) rule 6); inputs stay enabled unless the request would conflict.
4. On success: the button shows the check icon; the form becomes pristine; no toast unless something happens elsewhere. Navigate away only when the form was a creation page (go to the new entity).
5. On failure: keep the user's input, show the error, focus the first invalid field.
6. Leaving a dirty form asks "Leave without saving?" with **Stay** (secondary) and **Discard** (destructive).

## Do not

- Do not use placeholder text as a label or for required instructions (placeholders disappear and have low contrast).
- Do not use a switch inside a form that has a Save button.
- Do not mix field appearances: outlined only.
- Do not hide validation until submit for fields with unique/format rules; check on blur.
