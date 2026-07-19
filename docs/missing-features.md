# Missing Features & Improvements — with UI-fit hints

_Last updated 2026-07-18._

This doc is a **UI-oriented** feature catalog: every entry says not just _what_ to build, but _where it lands in the existing interface_ and which current pattern to reuse. It complements the broader backlogs — see [`ideas.md`](../ideas.md) (RFC/standards-oriented) and [`docs/todo.md`](./todo.md) (task tracker) — rather than repeating them. Where an item overlaps, it's cross-referenced instead of restated.

Each entry follows:

> **Feature** — one-line what & why.
> **UI fit:** the exact surface + the pattern already in the app to reuse.
> _(Effort: S / M / L)_

### Current UI surfaces (for reference)

- **Navbar** (`editor-navbar.tsx`): Clear (AlertDialog) · Import (hidden file input) · Version `Select` · Download `SplitButton` (VCF / QR PNG / QR SVG / Contact Image) · `ThemeToggle` · mobile preview toggle.
- **Form** (`contact-form.tsx`): 12 collapsible `FormSection`s with filled-count badges; repeatable rows for phones/emails/addresses/urls/IMPPs/related.
- **Preview** (`preview-tabs.tsx`): 3 tabs — **Visual** (`contact-preview.tsx`) · **Code** (raw VCF + copy) · **QR Code** (size check + Download SplitButton).
- **Global**: sonner `<Toaster/>`, reusable `shadcn-blocks/split-button.tsx`, `useCopyToClipboard`, `usePwaInstallPrompt`, `useIsElectron`.

---

## 1. Import & onboarding

- [ ] **Real drag-and-drop `.vcf` import** — the README already advertises this, but only click-to-browse exists today. Closing the gap is the highest-value quick win.
  **UI fit:** wrap the two-panel layout in `vcf-editor.tsx` with a drop target; show a dashed-border overlay on `dragover` and funnel the dropped file into the **existing** import handler (`file.text()` → `parseVcf` → `methods.reset`), reusing the current success/error toasts. _(Effort: S)_

- [ ] **Paste-a-vCard import** — let users paste raw VCF text (e.g. from an email) without a file.
  **UI fit:** turn the navbar **Import** button into a small split menu ("From file…" / "Paste…"); "Paste" opens a `Dialog` with a `Textarea` → `parseVcf`. _(Effort: S)_

- [ ] **"Load sample contact"** — one click to prefill a realistic card so first-time users see the app working.
  **UI fit:** a secondary button inside `preview-empty-state.tsx` (and/or the empty form); seed via `methods.reset(sampleData)`. _(Effort: S)_

- [ ] **Malformed-file feedback** — today a bad file fails quietly / merges oddly.
  **UI fit:** richer sonner **error** toast (reuse the existing error path) when `BEGIN:VCARD`/`END:VCARD` is missing; optionally list unknown properties captured as custom fields. Pairs with the "import robustness" item in `ideas.md`. _(Effort: S)_

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

- [ ] **"System" theme option** — the toggle is light/dark only, though `next-themes` supports `system`.
  **UI fit:** extend `theme-toggle.tsx` to a 3-way (Light / Dark / System), e.g. a small `DropdownMenu`. _(Effort: S)_

- [ ] **Keyboard shortcuts** — `Ctrl/Cmd+S` to export, a key to toggle preview, and tab switching.
  **UI fit:** a global key handler in `vcf-editor.tsx` calling the existing export/toggle handlers; surface the shortcuts in button tooltips. _(Effort: S)_

- [ ] **Electron-only niceties** — native touches when running as the desktop app.
  **UI fit:** gate with the existing `useIsElectron()` hook (`src/hooks/use-is-electron.ts`) to conditionally render things like a "Save to file…" native flow, or hide the PWA-install hint; deeper OS integration (file association, app menu) lives in `electron/main.ts`. _(Effort: M)_

---

## How to use this doc

Pick items by **UI surface** when you're already working in that area — e.g. touching the navbar? Knock out the PWA hint + undo/redo + shortcuts together. Pair each entry with its standards/implementation detail in [`ideas.md`](../ideas.md), and move anything you commit to into [`docs/todo.md`](./todo.md) with subitems. The **S** items in sections 1–3 (drag-drop, sample contact, autosave, re-enabling the install hint) are the highest impact-to-effort starting points.
