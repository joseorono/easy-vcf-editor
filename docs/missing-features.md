# Missing Features & Improvements — with UI-fit hints

_Last updated 2026-07-19._

> Checked items (`[x]`) shipped on the `v1-patches` branch. Each keeps a short **Shipped:** note describing what actually landed, since a few differ from the original plan.

This doc is a **UI-oriented** feature catalog: every entry says not just _what_ to build, but _where it lands in the existing interface_ and which current pattern to reuse. It complements the broader backlogs — see [`ideas.md`](../ideas.md) (RFC/standards-oriented) and [`docs/todo.md`](./todo.md) (task tracker) — rather than repeating them. Where an item overlaps, it's cross-referenced instead of restated.

Each entry follows:

> **Feature** — one-line what & why.
> **UI fit:** the exact surface + the pattern already in the app to reuse.
> _(Effort: S / M / L)_

### Current UI surfaces (for reference)

- **Navbar** (`editor-navbar.tsx`): Clear (AlertDialog) · Import `SplitButton` (From file… / Paste vCard…) · Version `Select` · Download `SplitButton` (VCF / QR PNG / QR SVG / Contact Image) · `ThemeToggle` (pill switch, light/dark) · mobile preview toggle.
- **Import** (`import-vcard-dialog.tsx`): tabbed `Dialog` — **Upload file** (dropzone) / **Paste text** (`Textarea`); plus a whole-window drop target in `vcf-editor.tsx`. Both routes share `importFromText`.
- **Form** (`contact-form.tsx`): 12 collapsible `FormSection`s with filled-count badges; repeatable rows for phones/emails/addresses/urls/IMPPs/related.
- **Preview** (`preview-tabs.tsx`): 3 tabs — **Visual** (`contact-preview.tsx`) · **Code** (raw VCF + copy) · **QR Code** (size check + Download SplitButton).
- **Global**: sonner `<Toaster/>`, reusable `shadcn-blocks/split-button.tsx`, `useCopyToClipboard`, `usePwaInstallPrompt`, `useIsElectron`.

---

## 1. Import & onboarding

- [x] **Real drag-and-drop `.vcf` import** — the README already advertises this, but only click-to-browse exists today. Closing the gap is the highest-value quick win.
  **Shipped:** `react-dropzone` powers two drop targets — a whole-window one in `vcf-editor.tsx` (`noClick`/`noKeyboard`, so it never hijacks normal clicks) and the dashed-border zone inside the import dialog's **Upload file** tab. Both funnel into the shared `importFromText`. Accepts `.vcf`/`.vcard`, one file at a time.

- [x] **Paste-a-vCard import** — let users paste raw VCF text (e.g. from an email) without a file.
  **Shipped:** navbar **Import** is now a `SplitButton` (main action = from file, menu = "From file…" / "Paste vCard…"), opening `import-vcard-dialog.tsx` on the matching tab. The paste tab is a monospace `Textarea` with a real vCard as placeholder; Import is disabled until it's non-empty, and the dialog only closes on success.

- [ ] **"Load sample contact"** — one click to prefill a realistic card so first-time users see the app working.
  **UI fit:** a secondary button inside `preview-empty-state.tsx` (and/or the empty form); seed via `methods.reset(sampleData)`. The paste-tab placeholder in `import-vcard-dialog.tsx` is already a usable sample to lift. _(Effort: S)_

- [x] **Malformed-file feedback** — today a bad file fails quietly / merges oddly.
  **Shipped:** `importFromText` guards explicitly (`parseVcf` never throws) and splits the two cases: missing `BEGIN:VCARD` → `toast.error("Import failed")`; a structurally valid but detail-less vCard → the gentler `toast.info("This vCard is empty")`. Both return `false`, so the dialog stays open for a retry.
  **Still open:** listing unknown properties captured as custom fields. See the "import robustness" item in `ideas.md`.

- [ ] **Warn before an import overwrites unsaved edits** — `importFromText` calls `methods.reset(parsedData)`, which silently discards whatever is in the form. Easy to trigger now that a stray drop anywhere in the window imports.
  **UI fit:** if the current form is non-empty (`isVCardEmpty(methods.getValues())` is false), route through the existing Clear-style `AlertDialog` — "Replace the contact you're editing?" — before resetting. _(Effort: S)_

- [ ] **Drag-and-drop phase 2: multi-file / multi-contact drops** — both dropzones are `multiple: false`, and a `.vcf` holding several cards imports only the first, with no notice that the rest were dropped.
  **UI fit:** at minimum, a toast when the parsed file contained more than one `BEGIN:VCARD` ("Imported the first of N contacts"). The full answer is the contact-list rail in [`multi-contact.md`](./multi-contact.md). _(Effort: S for the notice, L for real support)_

## 2. Export & sharing

- [ ] **Finish Contact Image export** — the "Contact Image" menu item is currently a "Coming soon" stub.
  **UI fit:** wire the existing Download `SplitButton` item; render the `contact-preview` card to a canvas (same rasterize approach as `qr-utils` PNG export) and download. _(Effort: M)_

- [ ] **jCard / JSON export + a 4th preview tab** — power users and integrations want the JSON (RFC 7095) form.
  **UI fit:** add a **"JSON"** tab beside Visual/Code/QR in `preview-tabs.tsx` (mirror the Code tab's `<pre>` + copy button), and add a "jCard (JSON)" item to the Download SplitButton. _(Effort: M)_

- [ ] **Copy affordances beyond the Code tab** — quick "copy full name" / "copy vCard" without switching tabs.
  **UI fit:** small ghost icon-buttons in `contact-preview.tsx`, reusing `useCopyToClipboard` (Check/Clipboard swap already implemented). _(Effort: S)_

- [ ] **QR options (ECC level, size, JPG)** — the QR tab is fixed at level M / 200px, PNG+SVG.
  **UI fit:** a compact controls row in the QR tab next to the existing size-status indicator; feed values into the current `qr-utils` download path. _(Effort: S)_

## 3. Persistence & recovery

- [ ] **Autosave to localStorage + restore** — the app is branded "offline-first" yet loses everything on reload (no storage anywhere in `src/`).
  **UI fit:** subscribe to the react-hook-form `watch()` and debounce-write to `localStorage`; on load, show a dismissible **restore bar** above the form (reuse `Card`/alert styling) offering "Restore" / "Start fresh". _(Effort: M)_

- [ ] **Undo / redo** — the Clear dialog even admits actions "cannot be undone."
  **UI fit:** two icon buttons in the navbar next to Clear, backed by a bounded history of RHF values (`getValues`/`reset`). _(Effort: M)_

- [ ] **"Wipe all local data"** — privacy hygiene once persistence exists.
  **UI fit:** add as a secondary destructive action in the existing Clear `AlertDialog`, or a small link in `footer.tsx`; clears storage + caches. Ties to the "data lifecycle" item in `ideas.md`. _(Effort: S)_

## 4. Editing power-ups

- [ ] **Field-level validation surfacing (Zod)** — currently only a visual `*` marks required; no inline errors. (Schema work is already tracked in `docs/todo.md`/`ideas.md` — this entry is the **UI** half.)
  **UI fit:** render inline `FormMessage` under inputs in `contact-form.tsx`; make a section's filled-count badge turn destructive/red when that section has errors, so problems are visible while collapsed. _(Effort: M)_

- [ ] **Structured `LANG` helper** — `languages` is a raw comma-joined string.
  **UI fit:** swap the raw input in Basic Information for a multiselect using the same pattern as `language-selector.tsx` / `timezone-selector.tsx` (`geo-input.tsx` already structures GEO). _(Effort: S)_

- [ ] **Mark a "primary / PREF" entry** on repeatable rows — vCard supports `PREF`; the model/UI don't expose it.
  **UI fit:** a star/`Toggle` on each phone/email/address row card; the starred row emits the `PREF` param on export. _(Effort: M)_

- [ ] **Collapse/expand-all + jump-to-section** — 12 sections is a lot of scrolling.
  **UI fit:** a small control row above the form driving the `Collapsible` open-states; optionally a section nav (anchor chips) that scrolls to a `FormSection`. _(Effort: S)_

## 5. Multi-contact (larger effort)

- [ ] **Multi-contact `.vcf` → list view, with select / merge / batch edit** — turns the app into a persisted contacts library (IndexedDB via Dexie), with a left contact-list rail feeding the existing editor. This is an architectural step, not a drop-in.
  **→ Full technical design: [`multi-contact.md`](./multi-contact.md).** _(Effort: L)_

## 6. Polish & platform

- [ ] **Re-enable the PWA "Install" hint** — `InstallPwaHint` is fully built but its navbar usage is commented out.
  **UI fit:** mount `<InstallPwaHint/>` in `editor-navbar.tsx` (uncomment); it already self-hides when the app isn't installable. _(Effort: S)_

- [x] **Theme switcher redesign** — the old pill parked its thumb *on top of* the active icon, so the covered icon was the current theme; both end icons stayed fully lit.
  **Shipped:** `theme-toggle.tsx` keeps the pill, but the thumb now carries the active icon and cross-fades it (rotate + scale) as it slides, with a dimmed marker on the destination side. Also fixed a real bug: it checked `theme === "dark"`, which misreads a dark OS while the provider default is `system` — now uses `resolvedTheme`. Renders a same-size spacer pre-hydration (no navbar reflow) and exposes `role="switch"` / `aria-checked`.

- [ ] **"System" theme option** — the toggle is light/dark only, though `next-themes` supports `system`. **Considered and deliberately deferred (2026-07-19)** during the redesign above, to keep the pill a two-state switch.
  **Known tradeoff:** `ThemeProvider` still defaults to `system`, so the app follows the OS until the first click — after which the user is locked into light/dark with no way back. Revisit if that one-way door causes complaints.
  **UI fit if revisited:** a 3-way segmented control, or long-press / `DropdownMenu` on the existing pill. _(Effort: S)_

- [ ] **Keyboard shortcuts** — `Ctrl/Cmd+S` to export, a key to toggle preview, and tab switching.
  **UI fit:** a global key handler in `vcf-editor.tsx` calling the existing export/toggle handlers; surface the shortcuts in button tooltips. _(Effort: S)_

- [ ] **Electron-only niceties** — native touches when running as the desktop app.
  **UI fit:** gate with the existing `useIsElectron()` hook (`src/hooks/use-is-electron.ts`) to conditionally render things like a "Save to file…" native flow, or hide the PWA-install hint; deeper OS integration (file association, app menu) lives in `electron/main.ts`. _(Effort: M)_

---

## How to use this doc

Pick items by **UI surface** when you're already working in that area — e.g. touching the navbar? Knock out the PWA hint + undo/redo + shortcuts together. Pair each entry with its standards/implementation detail in [`ideas.md`](../ideas.md), and move anything you commit to into [`docs/todo.md`](./todo.md) with subitems.

Now that the import items are done, the highest impact-to-effort remaining are **autosave to localStorage** (§3 — the app is branded offline-first but still loses everything on reload), **"Load sample contact"** (§1), **re-enabling the install hint** (§6), and the **overwrite warning** (§1), which the new whole-window drop makes easier to trigger than before.
