# 01 Design principles

## 1. One way to do each thing

If the platform has two ways to show a status, confirm a deletion or lay out a page header, users learn both and trust neither. Where the code had several variants, one is chosen here and the others are migrated to it.

Decision test: *before adding a style or component, find the existing one that does the job.* Search `webapp-common/shared/ui-components` and `webapp-common/styles/customizations` first.

## 2. Tokens, not values

Components do not contain hex colors or free pixel values. Colors come from `--color-*`; spacing, radius, sizes and type from the scale in [02-design-tokens.md](02-design-tokens.md). At the time of writing the stylesheets contained 270 distinct hex colors in SCSS and 173 distinct pixel values, which is why pages drift.

## 3. Dense, calm, technical

Users are ML engineers comparing runs, reading logs and scanning tables. Show information in a compact, readable form (14 px body text, 36 px controls, 40 px table rows); use space to group, not to decorate. No illustrations in working screens, no gratuitous animation, no gradients. Emphasis comes from weight, position and one accent color, not from many colors.

## 4. Show the true state

- Queued, running, finished and failed are different states and look different.
- A button that starts something says "Starting…" until the server accepted it, and the page shows the resulting state, not the user's expectation.
- Success is shown after the server answered, never before.
- Errors say what happened and what the user can do.

## 5. Everybody can operate it

Everything reachable by mouse is reachable by keyboard, visible focus is never removed, and information is not carried by color alone. See [09-accessibility.md](09-accessibility.md).

## 6. Progressive disclosure for technical detail

Show the identifier, status and the few values users need to decide. Put raw JSON, full paths, hashes and stack traces one click away (expander, tab, "copy" button). Never hide the state of a running job behind a click.

## 7. Preserve identity, improve coherence

Do not change the product's look wholesale. Material 3 components, the blue primary color, the icon-only side navigation, the light/dark themes and the dense tables stay.

## How to decide a case this documentation does not cover

1. Is there an existing page with the same need? Copy its structure.
2. Does one of the Standard rules apply by analogy? Apply it.
3. Still unclear: choose the simpler, more conventional option, and add the case to this documentation.
