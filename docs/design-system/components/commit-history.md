# Commit history (`sm-repository-history`)

The history of a repository that matters to CairnML, in the Git graph tab of Repositories & Datasets. It is not a full git graph: it shows the commits tasks ran on.

| Element | Rule |
|---|---|
| Rows | A vertical list, newest first. Each row, left to right: the commit id (monospace) over its date, right-aligned in the stamp column; the rail, one lane (`--lane-width`, `--space-4`) per branch, and a dot on the commit's lane (filled when tasks ran on it, hollow otherwise); the commit message (ellipsis, `--font-size-sm`); the symbol columns |
| What is shown | The newest commit, every commit a task ran on, the first commit only when a task ran on it. Commits that follow each other are connected without a gap |
| Lines | One drawing behind the whole list (a unit a row), so a line is never cut at a row. Every commit has one smooth curve (ease in, ease out) to each of its parents, starting on the commit's dot. A line changes lane in one row, next to the commit on the left lane; otherwise it is straight. Lines in the palette colours, 2px; dashed where commits are hidden. A line that leaves the window runs off the bottom of the list, it is not closed |
| Lane 0 | The default branch is always the left lane |
| Branches | Lanes: the default branch and every branch that has a task on a commit of its own. A branch leaves the main line at its fork point and ends at its tip or at the commit that merges it. Its name is a pill before the message. A footnote says that branches and commits without tasks are not shown |
| Gap | A dashed rail and "…"; hovering it says "X commits in between" |
| Dot | Grey: no task. Primary: tasks ran on it. Warning colour: at least one task ran with uncommitted changes |
| Symbols | One column each, left aligned, so a symbol is at the same place in every row, with a clear gap (`--space-4`) after the message: `newest` / `first` (leftmost), then uncommitted (alert icon and number, warning colour), then the number of tasks (primary container pill, always the rightmost), The words are in the tooltip and the aria-label. Pills use `--radius-full` and token colours only |
| Hover and focus | A row is focusable; hover and focus show the commit message, short sha, author and the tasks (up to 8, then "… and N more"), with `smTooltip` and `customClass="break-line"` |
| Limit | One limit for the whole graph, all branches together: the latest 30 commits or 30 tasks, whichever comes first. A note says so and how many tasks ran on commits that are not shown |
| States | Loading: the small inline spinner. Error and registry datasets: a one-line note |

Everything is spacing and colour tokens; no pixel values. The numbers (limit, gap counts) come from the server (`repositories.get_history`).
