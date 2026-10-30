# Configuration pages

Used for settings, credentials and create/edit forms rendered as pages. Reference: Settings → storage credentials (`webapp-common/settings/storage-credentials`).

## Structure

```text
Page header (56px)   [← back]  Title                      [Reset changes]  [Save]
Content (padding 24px, max-width 720px, left aligned)
  Section title (14px/500)
  Description (12px, secondary, ≤ 2 lines)
  Field (full width)                       16px
  Field                                    16px
  [group of two related fields in a row]
  — 32px —
  Section title
  …
```

## Rules

- Form actions live in the **page header** (existing pattern: "Reset changes" secondary, "Save" primary, both disabled until the form is dirty; Save also disabled while invalid). For forms longer than one screen, additionally repeat nothing; the header is sticky.
- Selecting among variants (providers) uses a list of options (tiles) leading to a sub-form with a back button; the list shows a "Configured" status for configured ones.
- Secrets: password-type input with a show/hide toggle; stored values are never shown back; label explains "Leave empty to keep the current value".
- Each section can be saved independently only if it is a separate form; do not mix independent saves on one page.
- After save: inline success on the button, the form stays; no navigation.
- Leaving with unsaved changes: confirmation dialog (Stay / Discard).
- Explain consequences in the description: what the setting is used for and who it affects.
