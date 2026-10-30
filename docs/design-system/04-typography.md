# 04 Typography

## Font

- Family: **Heebo** (self-hosted: Thin, Light, Regular, Medium, Bold in `webapp-common/assets/fonts`), fallback `sans-serif`. Token: `--font-family-base`.
- Monospace for code, ids and paths: `--font-family-monospace` (SFMono-Regular, Menlo, Monaco, Consolas…).
- Base size 14px (`html`). Weights available as font files: 300, 400, 500, 700. **Do not use 600**: no file exists, the browser fakes it (5 uses today).
- Letter spacing: normal everywhere, except that uppercase labels (below) use 0.04em.

## Scale (Standard values from the code, with names)

Counts are `font-size` declarations in SCSS: 12px 87, 14px 65, 16px 39, 10px 23, 11px 17, 15px 12, 20px 11, 18px 8, 13px 8, 24px 5.

| Role | Size / line height | Weight | Color | Token(s) | Use |
|---|---|---|---|---|---|
| Page title | 16px / 24px | 500 | `--color-on-surface` | `--font-size-lg` | Title in page header |
| Dialog title | 20px / 24px | 500 | `--color-on-surface` | `--font-size-xl` | Dialog header (`.create-title`) |
| Section title | 14px / 20px | 500 | `--color-on-surface` | `--font-size-md` | Titles above sections in a page |
| Card title | 14px / 20px | 500 | `--color-on-surface` | | Cards |
| Body | 14px / 20px | 400 | `--color-on-surface` | `--font-size-md` | Everything else |
| Secondary text | 12px / 16px | 400 | `--color-on-surface-variant` | `--font-size-sm` | Descriptions under titles, metadata, timestamps |
| Label (form, key in key-value) | 12px / 16px | 500 | `--color-on-surface-variant` | | Material floating label is 12px (existing `...label-text-populated-size: 12px`) |
| Helper / error text | 12px / 16px | 400 | variant / `--color-error` | | Existing `subscript-text-size: 12px` |
| Table header | 12px / 16px | 500 | `--color-on-surface-variant` | | Column titles |
| Table cell | 14px / 20px | 400 | `--color-on-surface` | | |
| Button | 12px / 16px (outlined) , 14px (filled/text) | 500 | by variant | | Existing mixed: outlined 12px, filled default. **Target: all 14px** except `sm`/`xs` (12px) |
| Badge / tag | 12px / 16px | 500 | | | |
| Metadata (ids, hashes) | 12px monospace | 400 | `--color-on-surface-variant` | | |
| Code | 12px or 13px monospace | 400 | | | Ace editor and inline code (`.inline-code` is 12px) |
| Tiny label | 11px | 500 | | `--font-size-xs` | Counters in dense chips only; never for essential information |

Retire: 10px (23 uses; below legibility target except decorative counters), 13px (use 12 or 14), 15px (merge into 16), 18px (use 16 or 20), 28/48/64/88px (empty-state glyphs are icons, not text).

## Rules

1. **Hierarchy through weight and color, not size.** Between body (14) and page title (16) there is only 2px; titles are distinguished by weight 500 and position.
2. **Case.** Use sentence case for labels, buttons, titles, menu items and tooltips ("Create task", "Agents & queues"). Existing: 27 `text-transform: uppercase` rules and 47 button labels typed in all caps in templates versus 6 typed in sentence case (counts of labels written literally in HTML; labels set in TypeScript were not counted), and navigation tooltips like "AGENTS & QUEUES". **Target:** sentence case. Uppercase is allowed only for the small section label inside tables and menus (11-12px, 0.04em), applied with CSS, never by typing capitals in the template.
3. Do not set `font-size`, `font-weight` or `font-family` in component SCSS if a Material component or the role above provides it.
4. Truncate with `.ellipsis` (existing) and always provide the full text via tooltip or `title`.
5. Numbers in tables are right-aligned and use `font-variant-numeric: tabular-nums`.
6. Technical identifiers (task id, hash, path, command) are monospace and have a copy affordance (`sm-copy-clipboard`).
7. Line length of running text: ≤ 80 characters (the 720px form width gives this at 14px).
