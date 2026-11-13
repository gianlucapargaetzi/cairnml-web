# Overview board (`sm-board-grid`, `sm-board-card`)

The project overview is a board of cards, one layout per project (`webapp-common/project-board`). Everyone on the project sees it; only the project owner edits it.

| Element | Rule |
|---|---|
| Grid | Six columns across the reduced page width. A tile is square: the column width. A row is a quarter tile (`SUB_ROWS` = 4), so a card is a whole number of tiles high (`h` a multiple of 4) except a divider, which is one row. Below 960px the grid is one column. GridStack runs it through the plain DOM API; no other layout code |
| Card surface | Every card has the same corner radius (`--radius-lg`), whatever its type or size. The panels of the old overview (project state, recent tasks, metric snapshot, contributions, description) bring their own surface (`bare`); every other card gets the board's card surface with `--space-3` padding |
| Card heading | Every new card starts with `sm-board-card-heading`: the title says what is shown (`--font-size-lg`, medium), the line under it says which runs, dataset or machines it is about (`--font-size-sm`, muted). Reading the two is enough to know what a number means: "Runs per day" / "All runs of the project", "Progress on loss / train" / "The runs of the task regression baseline". The reused panels keep their own headings |
| Figures | Numbers that sit side by side are `sm-board-tiles` / `sm-board-tile`: the same panels as the figures of the Contributions card. A label that needs attention uses the warning colour |
| Size of a new card | A card that holds content (figures, tables, lists, the old panels) starts one tile high and takes the next whole tile that shows everything (`fit` in `card-registry.ts`, measured for a few seconds after it is added). A card that holds a chart keeps its default size. After that the size is the owner's |
| Card states | Loading, empty and error notes sit in the middle of the card, centred, in the muted note style (`shared/_card-body.scss`) |
| Text in a card | Title `--font-size-md` medium; notes `--font-size-sm` in `--color-on-surface-variant`; a big number `--font-size-2xl`. Warning colour (`--color-warning`) only for "something to look at" (runs since the last improvement). No pixel values |
| View mode | No pens, handles or trash. Viewers (collaborator, read-write, read) never see the page pen |
| Edit mode | The pen at the top of the page toggles it. Each card shows its own pen (its settings dialog, only when the type has settings), a drag handle and a trash. Dragging and resizing snap to whole cells and tiles. The empty "Add card" placeholder at the bottom opens a dialog that lists the card types. There is no Save button: every change is saved at once, and a save made from an old version is refused with a message and reloads the board |
| Default board | A project without a saved board shows the content of the old overview as cards in a fixed arrangement (`default-board.ts`). It is not stored; the owner's first edit saves it |
| Loading | Every card loads on its own: the inline spinner, a one-line empty note that says what to do next, a one-line error note. A card whose type this version does not know shows the unavailable card, never an error page |
| Card types | project-state, recent-tasks, metric-snapshot, contributions, description (reused panels); plot, progress, dataset-content, agents, repositories (new); divider (a thin titled card) |
| Settings dialog | `sm-dialog-template`; the form fields follow each other in the order of the choices they depend on (plot: source, runs, what to show, chart type); Apply saves the card, Cancel drops the draft |
| Charts | The existing chart components only: `sm-line-chart` (also bars, on a time or a linear axis), `sm-donut`, `sm-scatter-plot`, with `presetColors` |

Rights: the server decides (`projects.get_overview_board` returns `can_edit`; `projects.set_overview_board` is owner-only).
