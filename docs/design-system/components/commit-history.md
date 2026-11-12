# Commit history (`sm-repository-history`)

The history of a repository that matters to CairnML, in the Git graph tab of Repositories & Datasets. It is not a full git graph: it shows the commits tasks ran on.

| Element | Rule |
|---|---|
| Rows | A vertical list, newest first. Each row has a rail (2px line, 24px wide, `--color-outline-variant`) with a dot, the commit message (ellipsis), the short sha (monospace), the date and tags |
| What is shown | The newest commit, every commit a task ran on, the first commit. Commits that follow each other are connected without a gap |
| Gap | A dashed rail and "…"; hovering it says "X commits in between" |
| Dot | Grey: no task. Primary: tasks ran on it. Warning colour: at least one task ran with uncommitted changes |
| Tags | `newest`, `first`, "N tasks" (primary container) and "N uncommitted" with the alert icon (warning colour). Pills use `--radius-full` and token colours only |
| Hover and focus | A row is focusable; hover and focus show the commit message, short sha, author and the tasks (up to 8, then "… and N more"), with `smTooltip` and `customClass="break-line"` |
| Limit | The latest 30 commits or 30 tasks, whichever comes first; the first commit is always shown. A note says so and how many tasks ran on commits that are not shown |
| States | Loading: the small inline spinner. Error and registry datasets: a one-line note |

Everything is spacing and colour tokens; no pixel values. The numbers (limit, gap counts) come from the server (`repositories.get_history`).
