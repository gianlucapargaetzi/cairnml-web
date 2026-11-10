---
name: cairnml-web-ui
description: Use BEFORE building, changing or restyling any page, tab, panel, card, table, chart, dialog, empty state or layout in the cairnml-web Angular UI (the web app of this repo). Triggers on requests like "make a UI page for X", "add a tab / dashboard / panel for Y", "show this data in the UI", "fix this layout", "this page looks unfinished". Assembles pages only from the app's existing components, layouts, shared styles and theme tokens, so new UI looks as if it had always been part of the app. Forces a search for the closest existing page, a design that pairs a table with a visual, and a MANDATORY Playwright check of the page, its sibling pages and every dialog, with measured numbers and before/after screenshots.
---

# cairnml-web UI

You are **not designing** in this codebase. You are **assembling** pages from parts that already exist. A new page must be indistinguishable in padding, surfaces, type, colour, controls and behaviour from the pages around it, even though its content is different. Consistency is the quality bar; novelty is a defect.

Where this skill and `CLAUDE.md` (repo root) disagree, this skill wins. (`CLAUDE.md` section 5 tells you to use the `$blue-*` scale for surfaces. The code does not: 232 of 348 stylesheets use `var(--color-*)` tokens and 3 use `$blue-*`. Use the tokens.)

The workflow below tells you when to read each reference file. Reading them is part of the work: do not build from memory of this document alone.

- `reference/archetypes.md`: the page shapes the app has, each with its twin files.
- `reference/components.md`: what to use for what, with real inputs and where it is used.
- `reference/tokens-and-layout.md`: colours, spacing, type, shell, text conventions.
- `reference/page-anatomy.md`, `reference/dialog-anatomy.md`, `reference/content-states.md`: the measured numbers every page and dialog must match.
- `reference/verify.md`: how to look at your page, in both themes, with realistic data.
- The repo's own design system (`docs/design-system/`, versioned with the code; this skill adds the measured numbers and the workflow, those documents hold the rules): `components/badges.md` (status, tags, **entity chips for references**, repository access badge), `components/tables.md` (table anatomy, **row actions**: size, place, order, icons, tooltips), `components/buttons.md`, `components/dialogs.md`, `components/forms.md`, `components/cards.md`, `components/feedback.md`, `components/icons.md`, `patterns/page-layouts.md`. Open the one for every element you add; when a document and the running app disagree, measure, then fix the document in the same change.
- `scripts/`: the Playwright login, seed, crawl, measure and gap-report scripts (`scripts/README.md`).


## Nothing is done until it has been looked at (mandatory, no exceptions)

Pages built "from the code" came out inconsistent every time. The code does not show a 24px gutter, an empty toolbar band, a 29px close button or an empty state under a table. A browser does. So:

1. **Before you change anything**, run the crawl on the untouched build for the pages and dialogs you will touch **and their siblings** (`scripts/README.md`): screenshots plus numbers. Those are the *before* images and you do not retake them.
2. **Build, redeploy the stack** (`reference/verify.md`), then take the *after* images with the same script, page, state, viewport and theme.
3. **Compare with the anatomy**: `reference/page-anatomy.md` (header 64, title x88 with its trail line, tabs centred with offset 0, symbol-only buttons, gutter 24, tables 0, toolbar directly under the header), `reference/dialog-anatomy.md` (width class, 36px close button, Cancel + action row), `reference/content-states.md` (empty, one row, many rows, long name, narrow, dark). Read the numbers from `gap-report.js` and run `scripts/shell-check.js` (header 64, tabs centred with offset 0, symbol-only buttons, content to the window bottom); do not say "looks aligned".
4. **Open every dialog your change touches or adds from its real button**, screenshot it, and check it against the dialog anatomy.
5. **Open the sibling pages and put the screenshots next to yours.** If yours differs from them in position or spacing, you are wrong, not them (unless the siblings break the anatomy, in which case fix the anatomy table in the same change).
6. **Evidence:** for each fix save `evidence/<finding>/before.png`, `after.png`, `side-by-side.png` with the measured numbers in the caption, and show the side-by-side to the user. A fix without an *after* image is not reported as fixed.
7. Run `scripts/fit-check.js` on every page you touch and its siblings (1000, 3440 and 10000px wide: no gap, nothing centred), and `scripts/tabs-check.js` when a page has tabs. Light **and** dark. Narrow (1024x768) **and the user's real screen, 3440x1440** (`scripts/wide.js`): a `max-width` plus `margin: 0 auto` is invisible at 1600px and leaves a full-bleed table inset on the wide screen. Tables are x 64..window edge at every width; nothing is centred by a max-width.

If Playwright or the stack is not available, say so and report the work as **unverified**. Never claim it is consistent.

## The workflow (in order, none optional)

**1. Name the data.** Write down: what are the entities, how many (3? 300?), what attributes, what state do they have, how do they relate, what will the user decide or do after looking? One short paragraph. If you cannot say what decision the page supports, ask.

**2. Find the twin. This step is mandatory and its result must appear in your final answer.**
Is there already a page or component that shows similarly structured content? **Read `reference/archetypes.md` now**, then search: `grep -rl "<sm-" --include=*.html` for the components you think you need, and open the closest page in the running app. State it explicitly: *"Twin: `<file>`, because both show `<shape>`."* If the twin exists, you copy its structure, its components and its styles. You do not reinvent.

**3. Pick the archetype** (from the file you just read). Dashboard, entity card grid, full-bleed table, master/detail, tabbed detail, compare, settings, empty state. Your page is one of these (or a combination of two). The archetype fixes the shell, the gutters and where the actions sit.

**4. Choose the representations. Never "just a table" and never "just cards".**
Most good pages in this app pair a **glanceable visual** with a **precise view**: KPI tiles or counters above a table; a chart next to a log; cards you open into a table. For each kind of data decide: what is the overview, what is the detail. Use the representation guide below. Write down at least two ways you considered showing the main data, and why you chose.

**5. Pick components from the catalog. Read `reference/components.md` now.** Every element you put on the page is an existing component, an existing shared style class, or a plain HTML element styled only through tokens. If the catalog has it, use it.

**6. Build.** Read `reference/tokens-and-layout.md` before you write any template or stylesheet, and obey the hard rules below. Start from your twin's files: copy its structure and shell, then change the content.

**7. Verify visually with Playwright (the mandatory section above). Read `reference/verify.md` first.** Light and dark, a wide and a narrow width, empty / few / many items, a long name, loading and error. Fix what you see before you report.

**8. Report.** Say which twin you followed, which components and shared styles you used, and anything that is new with the reason it had to be new. Say what you could not verify.

## Write the design brief before you write any code

Steps 1 to 5 end in a brief of about twelve lines. Put it in your reply (or in a comment at the top of the component) **before** you create files. If a line is "n/a" or "none", say why. A brief you cannot fill in means you have not finished steps 1 to 5.

```
Data:           <entities, how many, attributes, states, what the user decides>
Twin:           <existing page/file> because <same shape of content>
Archetype:      <A dashboard | B card grid | C table page | D master/detail | E tabbed detail | ...>
Overview:       <the glanceable visual: tiles / counters / chart / bars>  built from <components>
Precise view:   <the table or list>  built from <components>
Detail:         <where the full detail lives: split panel / expansion / dialog>
Alternatives:   <at least two other ways I could show the main data, and why not>
Shared styles:  <mixins and classes I include: panels.scss, empty.scss, ...>
New code:       <anything that is not an existing component or class, and why none fits>
States:         <empty / loading / error / long names / many items: how each looks>
Theme + width:  <how I will verify: light, dark, wide, narrow, with which data>
```

"Alternatives" is not optional: it is where the better design usually comes from. Typical alternatives are table vs cards, a chart vs counters, inline vs split panel.

## Hard rules

These are the rules that most often get broken. If you are about to break one, stop and go back to step 2.

1. **No new layouts.** Do not invent a page shell, a grid system, a sidebar or a toolbar. Use the shell of the archetype (`reference/archetypes.md`). Do not use `position: absolute` for layout.
2. **No new components when one exists.** Search the catalog and the shared folders first (`webapp-common/shared/ui-components`, `webapp-common/shared/components`). A near-match is extended or composed, not replaced.
3. **No manual sizing.** No hand-picked pixel paddings, margins, widths, heights, font sizes or radii. Take them from your twin's stylesheet, from the shared styles, or from the layout constants in `webapp-common/layout/layout.scss` and `webapp-common/styles/variables.scss`. The spacing scale in use is 24 / 16 / 12 / 8. If your twin sets the page gutter in a certain place, you inherit it; you do not add your own on top. Check the parent container before adding any padding.
4. **No colours of your own.** No hex, rgb or hsl in component styles. No `$blue-*`. Use only the `var(--color-*)` tokens (`reference/tokens-and-layout.md`). Status colours come from the status tokens. The one exception is chart series colours, which chart.js takes as hex: reuse the existing palette constants, do not make a new palette.
5. **No copying of styles.** If a style you need exists only inside one page's stylesheet, extract it once into `webapp-common/styles/mixins/` and use it from both places. Example already done: `mixins/panels.scss` (`dashboard-panels`) holds the panel, titles, badge and usage bars for the Dashboard, Workers and Jobs pages.
6. **No new loaders, empty states, dialogs, menus or tooltips.** Use the ones listed in the catalog.
7. **Never shrink the content to make it fit.** See the next section.
8. **Never repeat the page title inside the page.** The header already shows it. Lead with data.
9. **Terminology.** A *task* is a procedure, an *experiment* is one run of it, a *job* is a scheduled experiment. The API enum value `task` is not display text: use `entityDisplayName()` from `~/shared/constants/non-common-consts` for anything a person reads.
10. **A reference is a pill, a row's own name is not.** When a table, list or dialog *refers to* something inside CairnML (a project, dataset, queue, credential, task) use `sm-entity-chip` (`components/badges.md`): linked, with the icon of its kind. A list of the things themselves (the Name column of the datasets, queues or credentials list) stays plain text. People and external things (GitHub repositories) get no pill.
11. **Row actions follow one anatomy** (`components/tables.md`, "Row actions"): 36px icon buttons with a centred 20px icon in the last column, shown at once, specific actions first and the destructive one last, the same icon for the same meaning everywhere (trash = delete, × = take out of a place, share, refresh, lock = assign credentials), `smTooltip` as a verb phrase and `[attr.aria-label]` naming the row. Never size an icon in a component stylesheet with a rule that also matches the `mat-icon` inside a button. Measure them with `scripts/row-actions.js`.
12. **The same relationship has the same space everywhere.** Spacing is looked up, never chosen by eye: `docs/design-system/02-design-tokens.md` ("Which spacing where") and `reference/dialog-anatomy.md` (dialog rhythm). Form field to field 8px, note or alert to the next block 16px, last field to the action row 32px (measured from the field's box), page gutter 24px. Tokens are `--space-1..8` = 4, 8, 12, 16, **24**, **32**, 48, 64 (`--space-5` is 24 and `--space-6` is 32: do not use `--space-6` for 24). When a relationship is not in the table, add it there in the same change. Fields span their column; nothing stops short of the right edge.
13. **Project settings sections apply at once** (no Save button); a list's add dialog is a form dialog (rule 12 and `reference/dialog-anatomy.md`).
14. **Both themes, always.** If it only looks right in one, it is wrong.

## When the content does not fit

The content is the point. If a table, chart or list does not fit where you put it, **the layout or the representation changes, never the content.** Working through this ladder in order:

1. **Give it more room.** Let the element span the whole grid row (`grid-column: 1 / -1`), move it below instead of beside, or give the section the full width of the page.
2. **Move the detail out of the way, keep all of it.** Use the app's master/detail: `as-split` with a list on the left and a detail panel on the right (Experiments, Models, Endpoints, and the Workers page). The detail panel has room for a full table and a chart. For nested data inside a table, use the table's own row expansion.
3. **Use a different container.** A dialog (`sm-dialog-template`), a drawer, or a tab, when the detail is occasional.
4. **Change the representation.** Table to cards, cards to table, list to chart: whichever suits the amount and shape of the data.
5. Only if all of that is impossible, ask the user. Do not silently drop columns, replace a table with a "compact list", or hide information to dodge a layout problem.

## Representation guide: what data wants to look like

The app's strength is combining precise tables with visual summaries. Use this vocabulary, all of which already exists.

| The data is | Show it as | Built from |
|---|---|---|
| A handful of key numbers | KPI tiles: small title, big number, muted sub line | `.card`, `.card-title`, `.big`, `.sub` from `mixins/panels.scss` (see the Dashboard tab) |
| Counts by state for one entity (total / running / completed) | Circle counters inside a folder card | `sm-project-card` or `sm-card` with `sm-circle-counter` |
| Many comparable records, many attributes | A table with sort, filter, column picker and an optional detail split | `sm-table`; `sm-experiments-table` as the model |
| A state | Status label with icon, or a badge | `sm-status-icon-label`, `sm-circle-status`, `.badge` with `state-*` |
| How far a running task is | A small striped bar with the percentage next to the status (a ring in the narrow card list); in the detail panel a thin striped bar per level with its text centred in front of it | `sm-task-progress` (`mini` / `full`), the status strip of the task panel |
| Usage against a limit | Usage bar, with a high/full threshold colour | `mat-progress-bar.usage-bar`, or the two-layer `.bar` (used over promised) |
| A discrete set of resources (GPUs, slots) | A row of blocks, filled when taken | the `.gpu` block pattern on the Workers page |
| A value over time | Line chart panel with a range selector | `sm-line-chart` (chart.js); experiment results use `sm-single-graph` (plotly) |
| Share of a whole | Donut | `sm-donut` |
| A distribution or matrix | Plot panel (collapsible, titled) | `sm-experiment-graphs` / `sm-single-graph` |
| Events or logs | Activity feed or monospace log with a regex filter | Jobs page feed; console tab |
| Images | Thumbnail tiles with iteration paging | `sm-virtual-grid`, debug images view |
| Key/value details of one record | Label + value rows with dividers, in titled sections | `sm-labeled-row` inside `sm-section-header` / `sm-editable-section` |
| Code, JSON, config | Code or JSON viewer with copy | `sm-code-editor`, `sm-json-viewer` |
| Entities you open (a few to dozens) | Folder cards in a grid; the card opens the entity (click on the Projects page, double-click on the dashboards) | `sm-project-card`, `sm-card` in `.sm-card-list-layout` |
| Comparison | Colour-coded selection list on the left, one plot panel per metric on the right | `experiments-compare` |
| Tags / labels | Tag list | `sm-tag-list`, `sm-mini-tags-list` |
| A long list that pages | Load-more at the bottom | `sm-dots-load-more`, or the table's own load more |

A page of one kind of element is almost always wrong. Ask: *what is the picture, and what is the table?*

## Controls: what to use when

- **Primary action, one per view:** `mat-flat-button` (pill, filled), at the top right of its toolbar or section. Label in sentence case, short: `New experiment`.
- **Secondary action:** `mat-stroked-button`, same casing (`Open archive`).
- **Toolbar or row action:** `mat-icon-button` with an `al-ico-*` icon and an `smTooltip`.
- **Text link action:** `mat-button`, in sentence case to match (`View all`).
- **Switch between 2 or 3 views of the same data:** `sm-button-toggle` (icons), left of the search.
- **Filters on a list:** the table's own header filters (`sm-table-filter-sort`); card pages use `sm-main-pages-header-filter`.
- **Search:** `sm-search` above a list; the header search is global and already there.
- **Anything destructive:** `sm-confirm-dialog`, always.
- **Dialogs:** `sm-dialog-template` with panel class `dialog-md` (the default in 32 dialogs), `dialog-sm`, `dialog-lg` or `full-screen`.
- **Forms:** `mat-form-field`, outline appearance (the default), actions in one right-aligned row, primary last.

The case you type is the case that shows. Buttons, tabs, titles and labels are sentence case in this app (the current templates have 201 sentence-case button labels and 1 in capitals; see `docs/design-system/04-typography.md`). Copy the casing of the neighbouring controls. Uppercase is only for the small section label inside a table or menu, applied with CSS.

## States every page needs

- **Empty:** the shared look: muted icon, a title in sentence case ("No pipelines to show"), one line saying what to do, optionally a primary button or a getting-started code block. Use the `empty-state` / `empty-card-mixin` from `mixins/empty.scss`, or a `.card.empty` inside a dashboard-type page. Never a blank area.
- **Loading:** store-driven requests use the global spinner (`activateLoader` / `deactivateLoader`). A component that loads by itself uses a small inline `mat-spinner`. Never block the whole page.
- **Running but nothing to count** (a run that reports no progress, or is outside the loop that counts): the idle animation, a segment sliding along the bar (`progress.idle`) or the spinning ring, never a bar frozen at 0% or at the last value.
- **Error:** an inline short message in the failed colour, or the error dialog. Never `alert()`.
- **Lost / disabled / draining entities:** dim them (opacity) and say why with a badge; do not remove them.
- **Many items and long names:** truncate with `ellipsis` plus a tooltip; never let text push a container wider.

## Before you finish (self-review, answer every line)

- [ ] I named the twin and my page follows its shell, gutters and components.
- [ ] Nothing in my styles is a hex colour, a `$blue-*`, a hand-picked size, or a copy of another page's styles.
- [ ] Every element is a catalog component, a shared style class, or plain HTML styled by tokens.
- [ ] The page has a visual **and** a precise view where the data allows it.
- [ ] I did not shrink or drop content to make it fit; I changed layout or representation instead.
- [ ] Empty, loading, error, many, long-name states are handled and I looked at them, including a chart or panel with no data.
- [ ] I ran the overflow check from `reference/verify.md` in the open-detail state, at the narrow width, and it reports no wide elements.
- [ ] I looked at light **and** dark at a wide and a narrow width. No horizontal page scroll, no overlap.
- [ ] Every dialog I touched or added has the shared dialog rhythm (`scripts/add-dialogs.js` numbers equal to its siblings), full-width fields, and no Save button where the change applies at once.
- [ ] References to projects, datasets, queues, credentials and tasks are pills; row actions match the anatomy in `components/tables.md` (measured with `scripts/row-actions.js`).
- [ ] Button, tab and heading casing matches the neighbours; no repeated page title; terminology is task / experiment / job.
- [ ] `pnpm run build` passes.

## Mistakes already made in this repo (do not repeat them)

- Used `sm-card` for KPI tiles. It is the filled folder card for entities you open, and it rendered as tall blue blocks. KPI tiles are the plain bordered `.card` from `mixins/panels.scss`.
- Copied the Dashboard tab's panel styles into a second stylesheet instead of extracting them. Extract once, share.
- Put a multi-column table inside a 340px card, saw it overflow, and replaced it with a lossy list. The right answer was master/detail with the full table in the detail panel.
- Typed a button label in capitals ("SHOW JOBS") among the sentence-case buttons of the app.
- Assumed the page would look right in dark mode without opening it.
- Drew the progress of a running task as a line along the bottom edge of every table row, plus a ring. It looked wrong. In a list, progress is the small bar next to the status (as on the dashboard), nothing else.
- Made the detail view's progress bars 24px tall with the text drawn on them. It looked bad: keep them thin (6px / 3px) and put the text on a frosted label in front. They are slightly striped (faint, moving).
- Used the small progress bar in the card list, which is narrow and clipped it. Narrow places use the ring (`sm-task-progress` `circle`). Also: a shared mixin must not set `position`; the idle mixin once did and moved the absolutely positioned strip bar down by its own height.
- Trusted screenshots taken while the API was restarting: the pages looked broken only because the data was missing. Check the data first.
- Trusted `CLAUDE.md` (repo root) for colours (`$blue-*`) when the code uses `var(--color-*)`.
- Built a page as `display: grid` without `grid-template-columns: minmax(0, 1fr)`. A chart and a table made the column wider than its pane and pushed the close button off-screen. Only the overflow check in `reference/verify.md` caught it.
- Put a table in a bordered box with `overflow: hidden`, which silently clips columns. Use `overflow-x: auto`.
- Gave a chart panel no empty state: a machine without history showed a blank axis spanning a day.
- Styled `.al-icon` in a component stylesheet; it also hit the icons inside the page's icon buttons and left them 2.7px low. Scope such rules to the one element.
- Put pills on a row's own name (project settings lists) instead of only where something is referenced.
- Used different icons or tooltip wording for the same row action on different pages (trash vs ×, "Remove" vs "Remove from this project"). Check the table of icons in `components/tables.md`.
- Wrote own `.form`/`.actions` rules and `mat-dialog-actions` in add dialogs, so selects stopped short of the right edge and the buttons sat at different distances from the fields in each dialog. Use the shared mixin and measure with `scripts/add-dialogs.js`.
- Put an alert directly above a form field with no space (Share access). A block above a form is followed by 16px.
- Put a spinner inside a button without checking the button while it is busy: the spinner stacked above the label and the button looked broken. Check every busy state with the request delayed (Playwright `page.route` with a delay) and measure the button: same width and 36px height as idle.
- Took `--space-6` for 24px: it is 32px.
- Made a detail title 20px when the existing detail title (experiment info header) is 15px. Copy the twin's number, do not pick one.
