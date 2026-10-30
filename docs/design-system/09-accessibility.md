# 09 Accessibility

Target: **WCAG 2.2 level AA**. This page lists the requirements that matter for normal development, and the defects in the existing front end that block compliance. This was written from the code and compiled styles; no assistive-technology testing has been done yet.

## Known blockers (fix first; tracked as issues in this repository)

| ID | Finding | Evidence | WCAG |
|---|---|---|---|
| A-01 | Focus outlines removed globally | `styles/reboot.scss`: `* { outline: none !important; }`; 6 further `outline: none/0` rules; only 10 `:focus` rules in all SCSS | 2.4.7 Focus Visible, 2.4.11 |
| A-02 | Icon-only controls without names | 149 `mat-icon-button` and the 5 side-nav links versus 10 `aria-label` attributes in all templates | 4.1.2 Name, Role, Value; 2.5.3 |
| A-03 | Clickable non-interactive elements | 38 `(click)` on `div`/`span`/`i` | 2.1.1 Keyboard, 4.1.2 |
| A-04 | Row actions visible only on hover | `customizations/table.scss`: `.actions {visibility: hidden}`, shown on `tr:hover` | 2.1.1, 2.4.7 |
| A-05 | Dialog close button removed from tab order | `dialog-template.component.html`: `tabindex="-1"` | 2.1.1 (Esc still works) |
| A-06 | Low-contrast tokens | `--color-empty-state` ≈ 2.2:1 (light), `--color-completed` as text ≈ 3:1; verify with a tool | 1.4.3, 1.4.11 |
| A-07 | No reduced-motion handling | 0 uses of `prefers-reduced-motion` | 2.3.3 (AAA), good practice |
| A-08 | Body `overflow: hidden` and fixed-height shell | `reboot.scss` | 1.4.10 Reflow, 1.4.4 resize: verify at 200% zoom |
| A-09 | Small targets | `xs` buttons 16-20px | 2.5.8 Target Size (Minimum) 24px |

## Requirements for new work

### Keyboard
Everything operable with keyboard; logical tab order; no keyboard traps; shortcuts do not clash with browser/screen reader keys; Esc closes overlays.

### Focus
Visible focus on every interactive element: `outline: var(--focus-ring); outline-offset: 2px` applied with `:focus-visible`. Do not remove outlines; style them. Focus is not obscured by sticky headers (add `scroll-padding-top` equal to header height).

### Semantics
Use `<button>`, `<a>`, `<nav>`, `<main>`, `<header>`, headings in order (one `h1` per page: the page title; the app currently has two `h1` in templates and many sections without headings). Lists are `<ul>`; tables are `<table>` with `<th scope>`.

### Names and labels
Every form control has a label (Material `mat-label` is used 150 times: keep). Icon-only controls: `aria-label`. Images: `alt` (decorative: `alt=""`). Group related radios in a `mat-radio-group` with `aria-label`/legend.

### Color and contrast
Text 4.5:1, large text and UI components 3:1, in both themes. Do not use color alone: status = icon + text; errors = text + icon; required = asterisk + attribute. Check any new color pair with a contrast tool before adding a token.

### Dialogs and overlays
Role dialog, labelled by its title (`aria-labelledby`), focus trapped and restored (Material), Esc closes unless `disableClose` is deliberate. Toasts use `role="status"` (`role="alert"` for errors); keep errors visible until dismissed (existing).

### Forms
Errors linked to fields (`aria-describedby`, Material does this); error summary for long forms moves focus to the first invalid field; do not clear input on error.

### Motion
Respect `prefers-reduced-motion: reduce` (set `--duration-*` to 0 and disable spinners' non-essential animation, keep a static busy indicator).

### Zoom and reflow
Usable at 200% zoom at 1280px wide (content reflows without losing function); do not block zoom.

### Language
`<html lang="en">`; mark other-language text.

## Testing

For each new page: (1) tab through the page; (2) check focus ring visibility in both themes; (3) run an automated checker (axe browser extension or `@axe-core/playwright` in an end-to-end test; adding the package needs approval); (4) check contrast of new colors; (5) zoom to 200%.
