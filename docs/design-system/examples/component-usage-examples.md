# Component usage examples

## Page header actions

```html
<header class="page-header" role="banner"> <!-- becomes <sm-page-header> -->
  <h1>Queues</h1>
  <div class="actions">
    <button mat-stroked-button type="button" (click)="refresh()">Refresh</button>
    <button mat-flat-button type="button" (click)="create()">Create queue</button>
  </div>
</header>
```

## Form field with helper and error

```html
<mat-form-field appearance="outline">
  <mat-label>Queue name</mat-label>
  <input matInput formControlName="name" required>
  <mat-hint>Lowercase letters, digits and dashes.</mat-hint>
  @if (form.controls.name.hasError('unique')) { <mat-error>A queue with this name already exists.</mat-error> }
</mat-form-field>
```

## Confirmation (target API)

```ts
this.dialog.open(ConfirmDialogComponent, {
  panelClass: 'dialog-sm',
  data: {
    title: 'Delete task?',
    body: 'The task, its metrics and artifacts will be permanently deleted. This cannot be undone.',
    no: 'Cancel',
    yes: 'Delete task',
    destructive: true,        // new flag; replaces matching the label 'DELETE'
    iconClass: 'al-ico-alert',
  } as ConfirmDialogConfig
});
```

## Toast

```ts
this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Task '${name}' enqueued in '${queue}'`));
```

## Status

```html
<sm-status-icon-label [status]="task.status" [showLabel]="true"></sm-status-icon-label>
```

## Icon button

```html
<button mat-icon-button aria-label="Copy id" smTooltip="Copy id" (click)="copy()">
  <mat-icon fontSet="al" fontIcon="al-ico-copy"></mat-icon>
</button>
```

## Spacing with tokens

```scss
.toolbar { display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--page-padding-x); min-height: 48px; }
.section + .section { margin-top: var(--space-6); }
.panel { padding: var(--space-4); border: 1px solid var(--color-surface-container-high); border-radius: var(--radius-md); background: var(--color-surface-container-lowest); }
```
