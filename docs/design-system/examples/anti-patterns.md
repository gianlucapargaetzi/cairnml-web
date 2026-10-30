# Anti-patterns (found in the code or likely to be introduced)

| Anti-pattern | Why wrong | Do instead |
|---|---|---|
| `outline: none` on focusable elements (global in `reboot.scss`) | Keyboard users lose their position | Style `:focus-visible` with the ring token |
| `<i class="al-icon …" (click)="…">` | Not focusable, no name | `<button mat-icon-button aria-label>` |
| Label typed as `' SAVE '` / `'DELETE'` | Inconsistent case, whitespace, and the label decides styling | Sentence case labels and an explicit `destructive` flag |
| Destructive action styled as primary ("Abort", "Clear Queue" today) | Users click it by habit | Destructive variant + confirmation |
| Hard-coded `#d65b52`, `rgba(...)` in component SCSS | Breaks dark mode, drifts | `var(--color-failed)` etc. |
| `padding: 6px 14px` | Off-scale values multiply | `var(--space-2) var(--space-4)` |
| Bootstrap `ms-3` / `mb-3` in new templates | 14px at rem=14, off the 4px grid | `gap` and spacing tokens |
| `!important` to beat Material | Breaks overrides and themes | Material override variables in `customizations/` |
| A card around each form field group | Visual noise, nesting | Titled section, divider |
| A table where users compare attributes made of cards | Hard to scan | `sm-table` |
| Showing "Running" while the task is queued | Dishonest state | Real status from the server |
| Toast for a field validation error | Disappears; not tied to the field | `mat-error` |
| Success toast before the request completes | Wrong if it fails | Wait for the response |
| Hover-only actions | Unreachable by keyboard/touch | Show on hover and focus-within, plus the row menu |
| Native `title` tooltips next to `smTooltip` | Two behaviours | `smTooltip` (323 uses) |
| New dialog width in TypeScript (`width: '720px'`) | Off-system | `panelClass: 'dialog-md'` etc. |
| A dialog containing another dialog | Focus and back behaviour break | Change the flow or use a page |
| ALL-CAPS typed labels ("RESET CHANGES") | Hard to read, inconsistent | Sentence case |
| Docs links to another product (clear.ml) | Wrong instructions | CairnML documentation |
