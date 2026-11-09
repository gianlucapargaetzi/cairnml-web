# Scripts for the visual check

Run them from this folder. Install once: `npm install` (Playwright; then `npx playwright install chromium` if no browser is cached).
The stack must be up at `http://localhost/cairnml/`. Environment: `CAIRNML_ENV` (path of the stack's `.env`, default `../cairnml-server/deploy/.env` next to this repo), `EVIDENCE_DIR` (screenshots, default `../ui-evidence` next to this repo, outside every repo), `CHROMIUM` (browser binary).

| Script | What it does |
|---|---|
| `login.js` | Signs in as the admin from `cairnml-server/deploy/.env` and writes `state.json`. The password is read inside the script and never printed. Do not commit `state.json`. |
| `seed.js`, `seed-events.js` | Create `ui-audit-*` data (projects, tasks, model, report, dataset) and record the ids in `seed-ids.json`. Delete exactly those ids when done. |
| `crawl.js <outdir> [w] [h] [light\|dark] [pages\|dialogs]` | Visits every page (with its header tabs) or, in `dialogs` mode, opens every dialog and popup it can reach from a button or menu. Writes `<outdir>/audit.json` and `<outdir>/shots/*.png`. |
| `fit-check.js [widths] <path>...` | Width independence: at each width (default 1000, 1600, 3440, 10000) every table must reach from the side nav to the window edge, card grids start at the 24px gutter, and no block may sit centred with an empty band on both sides. Prints FLAG lines. Run it for every page you touch and its siblings. |
| `tabs-check.js <task or model path> [widths]` | Clicks every tab of a task or model page and prints where the tab bar sits: it must be identical on every tab. |
| `row-actions.js <path>...` | Measures the icon buttons in the table rows of the given pages (size, icon centring, row offset, right gap). Compare with "Row actions" in `docs/design-system/components/tables.md`. |
| `gap-report.js <outdir>/audit.json [--md]` | Prints, per page, the header height, title position, trail, tab centring offset, toolbar y/height, table gutters, first block gutter and horizontal scroll. |
| `shell-check.js <outdir> [w h]` | Checks the one header on every page: height 64, title and trail present, tabs centred (offset 0), symbol-only buttons, content ends at the window bottom, no overflow. Prints PROBLEMS per page. Run it for every UI change, at 1600x900 and 1280x720. |
| `shoot.js` | Template: screenshot and measure the pages and dialogs you changed. Copy it, change the list. |

Always take the **before** run on the untouched build, the **after** run on the same pages, states, viewport and theme, and make a side-by-side (`evidence/<finding>/before.png|after.png|side-by-side.png`) with the measured numbers in the caption.

| `wide.js [dark]` | Screenshots and measures the key pages at 3440x1440 (the user's screen). Run it for every layout change. |
