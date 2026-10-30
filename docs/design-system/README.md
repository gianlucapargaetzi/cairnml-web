# CairnML design system

This directory is the authoritative reference for the look, layout and behaviour of `cairnml-web`. It was written from the code as it is on 2026-10-30 and keeps the existing identity: Angular Material 3 with a blue/teal palette, light and dark theme, Heebo font, a narrow icon-only side navigation, a 64 px header with breadcrumbs, dense tables.

It does not describe a redesign. It names what the app already does best, picks one variant where the code has several, and says what to change to get there. The remaining migration work is tracked as GitHub issues of this repository (labels `P0`-`P3`, titles describing the change).

## How to use this documentation

**Building or changing a page.** Read in this order: [`patterns/page-layouts.md`](patterns/page-layouts.md) (pick the page type), the matching pattern page, then [`06-component-guidelines.md`](06-component-guidelines.md) (which component for which job). Use only tokens from [`02-design-tokens.md`](02-design-tokens.md).

**Every session that touches `cairnml-web` must read and follow this documentation** (see `CLAUDE.md` in the repository root).

**Reviewing a change.** Use the checklist at the end of [`10-frontend-implementation.md`](10-frontend-implementation.md).

**Coding agents.** The "Rules" boxes and the decision tables are normative: follow them literally. Where a rule says *target*, the code base does not yet comply everywhere; new code must comply, old code is migrated per the plan. Do not invent values. If nothing here covers a case, pick the closest rule and add the case to this documentation in the same change.

## Status words used

- **Standard:** exists in the code and is the rule.
- **Target:** the rule going forward; the code mostly does not follow it yet.
- **Proposed token:** a CSS variable that does not exist yet and must be added (see [`02-design-tokens.md`](02-design-tokens.md)).

## Core principles (details in [`01-design-principles.md`](01-design-principles.md))

1. One way to do each thing.
2. Tokens, not values: no hex colors, no free pixel values in component styles.
3. Dense, calm, technical: information first, decoration never.
4. Always show real state: queued is not running is not done.
5. Keyboard and screen reader users are users.

## Contents

| Document | Content |
|---|---|
| [01-design-principles.md](01-design-principles.md) | Principles and how to decide |
| [02-design-tokens.md](02-design-tokens.md) | All token values (spacing, radius, size, elevation, z-index, motion, breakpoints) |
| [03-layout-system.md](03-layout-system.md) | Application shell, page structure, widths, vertical rhythm, responsive rules |
| [04-typography.md](04-typography.md) | Font, scale, roles |
| [05-color-system.md](05-color-system.md) | Semantic colors with real light/dark values, status mapping |
| [06-component-guidelines.md](06-component-guidelines.md) | Which component to use when |
| [07-interaction-patterns.md](07-interaction-patterns.md) | Click, hover, focus, selection, keyboard, confirmation, submission |
| [08-ux-guidelines.md](08-ux-guidelines.md) | Loading, empty, error, success, destructive, long-running states; terminology; density |
| [09-accessibility.md](09-accessibility.md) | WCAG 2.2 AA requirements and the known blockers |
| [10-frontend-implementation.md](10-frontend-implementation.md) | Where code goes, shared components, enforcement, review checklist |
| components/ | [buttons](components/buttons.md), [forms](components/forms.md), [tables](components/tables.md), [cards](components/cards.md), [dialogs](components/dialogs.md), [navigation](components/navigation.md), [feedback](components/feedback.md), [badges](components/badges.md), [icons](components/icons.md) |
| patterns/ | [page-layouts](patterns/page-layouts.md), [list-pages](patterns/list-pages.md), [detail-pages](patterns/detail-pages.md), [configuration-pages](patterns/configuration-pages.md), [forms-and-workflows](patterns/forms-and-workflows.md) |
| examples/ | [reference-page-structures](examples/reference-page-structures.md), [component-usage-examples](examples/component-usage-examples.md), [anti-patterns](examples/anti-patterns.md) |

## Token overview

| Group | Source of truth | Status |
|---|---|---|
| Color | CSS variables `--color-*` (generated from the Material 3 theme in `styles/customizations/colors.scss`) | Standard |
| Spacing, radius, size, type scale, elevation, z-index, motion | none as CSS variables today (SCSS variables in `styles/variables.scss`, free pixel values in components) | Proposed tokens `--space-*`, `--radius-*`, `--size-*`, `--font-size-*`, `--z-*`, `--duration-*` |

## Rules for new components

Create a shared component only when the same thing is needed on at least two pages **and** none of the components in [06-component-guidelines.md](06-component-guidelines.md) covers it. Put it in `src/app/webapp-common/shared/ui-components/`, document it in the matching `components/*.md` page in the same change, and list its variants there.

## Rules for modifying existing components

Changing a shared component changes every page that uses it. Before you edit one, search its selector in `src/app` (`grep -r "<sm-name" src/app`), list the pages in the change description, and update this documentation if a variant, size or behaviour changes.

## Maintenance

Owner: whoever changes the front end owns the matching document. A change that adds a color, size, variant or pattern without updating these pages is incomplete.
