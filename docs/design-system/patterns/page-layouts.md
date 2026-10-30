# Page layouts

Choose the template, then follow the matching pattern page. Shell and spacing: [03-layout-system.md](../03-layout-system.md).

| If the page… | Template | Reference page in the app |
|---|---|---|
| lists many records | [List page](list-pages.md) | Tasks list (`webapp-common/experiments`), models, pipelines |
| lists entities as tiles | [List page, card variant](list-pages.md) | Projects (`sm-card-list-layout`) |
| shows one record in depth | [Detail page](detail-pages.md) | Task detail (tabs general, execution, artifacts, hyper-params, scalars, plots, debugImages, log) |
| edits settings or credentials | [Configuration page](configuration-pages.md) | Settings → storage credentials |
| creates something with several fields | [Forms and workflows](forms-and-workflows.md) | enqueue dialog, create project dialog |
| monitors live state | List page + summary strip + panels | Agents & Queues (`features/workers-and-queues`), endpoints |

## Common skeleton

```text
sm-page-header   56px   title · status · actions
tabs (optional)  48px   mat-tab-nav-bar
toolbar (list)   48px   search · filters · view options · counts
content          fills  scrolls inside; 24px side padding
```

Every page: one `h1` (the title), landmarks (`main`), own scroll container, loading/empty/error states, and the same horizontal padding (24px).
