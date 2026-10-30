# Buttons

Implementation: Angular Material buttons, customised in `styles/customizations/buttons.scss`. Height 36px default; `sm` 24px; `xs` 20px.

## Variants

| Variant | Markup | Count today | Use |
|---|---|---|---|
| **Primary** | `<button mat-flat-button>` | 79 | The one main action of a page, dialog or form: Save, Create, Enqueue, Confirm |
| **Secondary** | `<button mat-stroked-button>` | 58 | Alternatives next to a primary: Cancel, Reset, Export |
| **Tertiary** | `<button mat-button>` | 29 | Low emphasis: toolbar actions, "Load more", links that act |
| **Destructive** | `<button mat-flat-button class="delete-button">` | 1 (+ the confirm dialog, see below) | Final button of a deletion/termination, always inside a confirmation |
| **Icon** | `<button mat-icon-button aria-label="…">` | 149 | Compact actions: refresh, close, menu trigger, row actions |
| **Link** | `<a class="link">` / `routerLink` | | Navigation only. Never for actions |

`.secondary-button` (0 uses) is **not** a standard variant; `.tertiary-button` (4 uses) is allowed only for an accent action inside a primary-heavy area. Do not add new color variants.

## Rules

1. **One primary action per view.** A page header, a dialog and a form footer each have at most one filled button.
2. **Order.** Reading order left to right: tertiary, secondary, primary. In dialogs: Cancel (secondary), then the action (primary/destructive), centered (existing). In a page header the actions are right aligned with the primary rightmost.
3. **Destructive actions never look like primary actions.** Use the destructive variant and a confirmation (see [dialogs](dialogs.md)). Destructive style is set with a flag, not by guessing the label: `ConfirmDialogConfig.destructive` applies `delete-button`. Custom dialogs set the class directly.
4. **Labels:** sentence case verb or verb + object ("Create task", "Delete", "Save changes"). No all-caps typing, no leading/trailing spaces (currently `' SAVE '`, `'DELETE'`, `'CANCEL'`). Cancel label is always "Cancel" (not "Keep", "Stay", "Back" unless the dialog is about leaving/discarding, where the safe choice is named).
5. **Icons in buttons:** leading icon 16px (existing), optional, only when it adds recognition. Icon-only buttons are 36px (default) with a 20px icon, `sm` 24/16, `xs` 16/14 (use `xs` only in dense table rows).
6. **Loading:** when the action is in progress, disable the button, replace the leading icon with a 20px `mat-progress-spinner` (`strokeWidth` 2) and keep the label (existing pattern in storage credentials). After success show a check icon briefly; do not change the label.
7. **Disabled:** use `[disabled]`; explain why with a tooltip when it is not obvious (e.g. "Nothing to save", "Fix the errors above").
8. **Accessibility:** every icon-only button has `aria-label` (at the time of writing: 10 `aria-label` attributes against 149 icon buttons) and a tooltip with the same text. Minimum hit area is 24x24px; `xs` buttons only with ≥ 4px spacing around them.
9. **Types:** `type="button"` for everything except the submit of a form.
10. Do not set `width`, `height`, `padding` or `border-radius` on buttons in component SCSS.

## Examples

```html
<!-- page header actions -->
<button mat-stroked-button type="button" (click)="reset()" [disabled]="form.pristine">Reset changes</button>
<button mat-flat-button type="submit" [disabled]="form.invalid || form.pristine || saving()">
  @if (saving()) { <mat-progress-spinner mode="indeterminate" diameter="20" strokeWidth="2"/> }
  Save
</button>

<!-- icon button -->
<button mat-icon-button aria-label="Refresh" smTooltip="Refresh" (click)="refresh()">
  <mat-icon fontSet="al" fontIcon="al-ico-refresh"/>
</button>
```
