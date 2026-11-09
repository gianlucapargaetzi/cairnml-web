# Content states: what must still look right

Every list page must be opened in each state below, with Playwright, and compared with the screenshots of its siblings.

| State | Must look like |
|---|---|
| Empty | `sm-empty-state` at the standard position (see page-anatomy G); the page-header actions stay; no table, no stray toolbar |
| One row | table at 0px gutter, header row 40px, no empty state below it |
| Six rows | rows 40px, no layout jump when the row count changes |
| 200 rows | the table scrolls inside the page; the header and toolbar stay |
| Name of 80 characters | one line, ellipsis with tooltip; the table gets no horizontal scrollbar; the actions column stays visible |
| Count changes (a row is added or removed) | the empty state and the table never appear together; the detail panel clears when its row is removed |
| Loading | inline spinner or the global loader; no half-drawn empty state |
| Error | one error line, no empty state saying "No X yet" |
| Narrow (1280x720, 1024x768) | no horizontal page scroll; toolbar wraps; table scrolls inside itself |
| Dark theme | same layout; no hard-coded light colours |

Per page: write the states you changed and looked at into your report (and into `UI_IMPROVEMENT.md` if the repo owner keeps one next to the repos), each with its screenshot name.
