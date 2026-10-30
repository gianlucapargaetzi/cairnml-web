# Dialogs, modals and popovers

Implementation: Material dialog wrapped by `sm-dialog-template` (header, optional icon, content) and `ConfirmDialogComponent` for confirmations (67 references). Sizes via `panelClass`.

## Dialog or page?

| Use a dialog | Use a page |
|---|---|
| Confirm an action | More than ~5 fields or sections |
| Enter 1-5 fields (rename, create queue, add tag) | Content the user may want to link to or come back to |
| Pick from a short list | Anything with its own tabs or scrolling data |
| Show a single result (share link, credentials once) | Multi-step flows longer than 3 steps |

A dialog may open a menu. It may open one inner dialog, and only in two cases; the inner dialog opens no further dialog:

- **Content management:** adding, editing or removing an item inside a dialog, such as adding a user to a project's settings dialog or changing one of its members. The inner dialog is a popup with the content and the cancel and apply buttons.
- **Message boxes:** confirmations and notices raised from inside a dialog, such as "Remove viewer1?".

Any other decision needed inside a dialog is either done inline in the dialog or handled by closing the first dialog and changing the flow. Give the inner dialog its own `panelClass` (`dialog-sm` for confirmations, `dialog-md` for forms).

## Sizes (Standard)

| Class | Width | Use |
|---|---|---|
| `dialog-sm` | 430px | Confirmations, rename |
| `dialog-md` | 640px | Default forms (36 of the dialogs opened in code) |
| `dialog-lg` | 768px | Forms with lists |
| `dialog-xl` / `dialog-xxl` | 1024 / 1200px | Pickers with tables, JSON editors |
| `full-screen` | viewport − 32px | Image viewer, compare |

Always pass one `panelClass`. Do not set `width`/`maxWidth` in TypeScript (hard-coded widths appear in dialog configs today).

## Structure

```text
[ icon (48px, optional) ]
Title (20px/500, one line)           [X close, top right]
Description (14px, secondary)         (optional, ≤ 2 lines)
Content (scrolls if needed)
            [ Cancel ]  [ Primary / Destructive ]   (centered, 8px gap)
```

- Padding 24px. One primary action. Cancel is a secondary button, always present for decisions.
- Esc and the X close the dialog (= cancel). Backdrop click closes only dialogs without input; dialogs with input or destructive decisions set `disableClose`.
- Initial focus: first field; for confirmations focus the **safe** action (Cancel) for destructive ones.
- The X button in `sm-dialog-template` has `tabindex="-1"` (not reachable with Tab): **target** remove it; Esc remains.

## Confirmation dialogs

Use `ConfirmDialogComponent` with: a title that names the action and object ("Delete task?"), a body that states the **consequence** ("The task, its metrics and artifacts will be permanently deleted. This cannot be undone."), `no: 'Cancel'`, `yes` = verb + object in sentence case, `destructive: true` for deletion/termination/overwrite/revoke/discard. The flag alone styles the confirm button (`delete-button`); labels are never matched. With `destructive`, the Cancel button takes the initial focus. Leaving a page with unsaved changes uses `no: 'Stay'` and `yes: 'Discard changes'` (destructive).

Confirm only when the action is destructive, irreversible, costly or affects others. Do not confirm harmless actions (opening, filtering, refreshing, reversible toggles). Where an action can be undone, prefer a toast with "Undo" over a dialog.

For deletions of many items, state the count: "Delete 12 tasks?".

## Popovers and menus

`mat-menu` panels: 1px border, 4px padding, 14px items with 20px icons, min 114px / max 450px width. Use for lists of actions. Popovers with forms are not allowed; use a dialog.
