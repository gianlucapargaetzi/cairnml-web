# 10 Frontend implementation conventions

## Stack (as is)

Angular 21 (standalone components, signals, new control flow `@if`/`@for`), NgRx store and effects, Angular Material 21 (Material 3), PrimeNG 21 (data table, slider), Bootstrap 5 resets/utilities, SCSS compiled with the `sass` load path `src/app/webapp-common/styles`, component selector prefix `sm-`, custom icon font. Dark mode: class `dark-mode` on `:root`, the same variables redefined.

## Where code goes

| What | Where |
|---|---|
| Tokens (CSS variables) | `webapp-common/styles/customizations/` (`colors.scss` exists; add `tokens.scss`) |
| Material overrides | `webapp-common/styles/customizations/<component>.scss`, using Material's override mixins/variables |
| Global mixins | `webapp-common/styles/mixins/` |
| Reusable UI components | `webapp-common/shared/ui-components/<group>/` (`buttons`, `data`, `indicators`, `inputs`, `overlay`, `panel`, `tags`) |
| Feature components | `features/<feature>/` or `webapp-common/<feature>/` |
| Page-specific styles | the component's own `.scss` (encapsulated), using tokens only |
| Utility classes | `styles/utilities.scss` only; no new Bootstrap-style utility sets |

## Styling rules

1. **Order of preference:** Material component + its design tokens/override variables → shared class from `customizations/` → component SCSS using tokens.
2. Use CSS variables (`var(--space-3)`, `var(--color-primary)`) not SCSS variables, so both themes and runtime changes work. The legacy SCSS variables in `variables.scss` (488 definitions) are not used in new code.
3. No hex/rgb colors, no raw pixel values for spacing/radius/size/font-size outside the token scale. Allowed raw numbers: `0`, `1px` borders, `100%`/`auto`, layout dimensions specific to one component (documented with a comment).
4. No `!important`. The code base has 219; each removal is a migration item. Material specificity is solved by the override variables, not `!important`.
5. No inline `style` attributes with static values (33 exist); dynamic values only (e.g. `[style.--dialog-icon-color]`).
6. Use `:host` and component-scoped SCSS; avoid `::ng-deep`. If deep styling is needed, it belongs in `customizations/`.
7. Do not set `z-index` outside the scale; do not use `position: absolute` for layout that flex/grid can express.
8. Use `gap` for spacing between siblings, not margins on children.
9. Responsive: only the three breakpoints in the token page, via a mixin.

## Shared components to create or consolidate (only these)

| Component | Purpose | Today |
|---|---|---|
| `sm-page-header` | Title, back, status, description, actions slot, 56px | two competing classes (`.page-header` 64px, `.sm-entity-page-header` 56px) and per-page headers |
| `sm-empty-state` | Icon, title, sentence, action | SCSS mixins copied per component |
| `sm-form-section` | Section title, description, fields column, 720px max width | ad hoc per form |
| `ConfirmDialog` `destructive` flag | Destructive styling | exact-label-match hack (`['DELETE','DEACTIVATE']`) |
| `sm-inline-alert` | Persistent inline message | none |

Do **not** create wrappers around Material buttons or form fields; use them directly with the documented classes.

## Enforcement

Prefer checks that need no new dependency:

1. **Token check script** (proposed `scripts/check-design-tokens.sh`, run in CI next to the build): fails on newly added hex colors (`#[0-9a-fA-F]{3,8}`), `!important`, `box-shadow`, `border-radius`/`gap`/`padding` pixel values outside the scale in changed `.scss` files (diff against the base branch, so the existing debt does not block).
2. **ESLint** (already present, `ng lint`): add template rules for `click-events-have-key-events` and `interactive-supports-focus`, `alt-text`, `label-has-associated-control` from `@angular-eslint/template` accessibility ruleset (already a dependency family; verify before enabling).
3. **Stylelint** would do (1) better but is a new dependency: propose later, only if (1) proves insufficient.
4. **Visual regression / Storybook:** not justified now (no component catalogue exists, 48 specs); revisit after the migration phase 3.
5. **Review checklist** below.

## Review checklist (copy into pull request descriptions)

- [ ] Page uses a template from [patterns/page-layouts.md](patterns/page-layouts.md) and `sm-page-header` (once it exists)
- [ ] Exactly one primary button per view; destructive actions confirmed
- [ ] Only tokens: no new hex, no off-scale px, no `!important`, no new shadow
- [ ] Components from [06-component-guidelines.md](06-component-guidelines.md); no new variant without documentation
- [ ] Loading, empty and error states implemented
- [ ] Icon-only controls have `aria-label` and tooltip; focus visible; keyboard path tested
- [ ] Labels in sentence case, terminology from [08-ux-guidelines.md](08-ux-guidelines.md)
- [ ] Works in light and dark theme
- [ ] This documentation updated if a pattern, token or component changed
