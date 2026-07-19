# ToDo (created December 8, 2025)

_Status reviewed on 2026-07-18._

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

# Tasks

- [x] Add Test Suite.
- [ ] Add unit tests — No unit tests exist yet.
- [ ] Replace the old logo with new one — The old logo is still being used, replace it with the new one, replace fav icon too, update the navbar logo (og:image). - Assigned to Andreina
- [ ] **Zod validation for the form helpers** — Zod is installed but not yet used anywhere in `src/`.
  - [ ] Define the contact schema (co-locate as `*.types.ts` or in `src/types/`).
  - [ ] Wire `@hookform/resolvers/zod` `zodResolver` into the react-hook-form setup.
  - [ ] Surface validation errors in the form UI.
  - [ ] Reuse the schema when parsing/serializing in `src/lib/vcf-utils.ts`.

- [x] **Visual refresh** — Form layout refactored and spacing adjusted.
  - [x] Refactor form layout.
  - [x] Adjust spacing.

- [x] **Test compatibility of outputted .VCF files with various clients** (e.g., Outlook, iOS Contacts).
  - [x] Validate exports against Outlook.
  - [x] Validate exports against iOS Contacts.

- [ ] **Custom theme via the shadcn style generator** — Still using the default neutral theme.
  - [ ] Choose a palette / brand color.
  - [ ] Run the shadcn theme generator.
  - [ ] Replace the CSS tokens in `src/index.css`.
  - [ ] Verify light and dark modes.

- [ ] **Reduce the number of FormSections to save vertical space** — Still ~12 sections.
  - [ ] Audit the current sections and group related fields.
  - [ ] Merge low-density sections.
  - [ ] Settle on a target section count.

- [x] **Move additional fields into Basic Information** — Language, Timezone, Photo, Logo and others relocated there.

- [x] **Group the Gender field with related fields** — Now sits alongside First/Last Name in Basic Information.

- [x] **Update the app icon and favicon** — Added `pwa-icon.svg`, `apple-touch-icon`, `mask-icon`, and `theme-color`.

- [~] **Add SEO metadata** — Core tags and social cards in place. - Assigned to Andreina
  - [x] Title, description, and `theme-color`.
  - [x] Open Graph tags (`index.html`).
  - [x] Twitter card tags (`index.html`).
  - [ ] Replace the SVG `og:image`/`twitter:image` with a raster (PNG/JPG) preview image for wider crawler support.

- [x] **Establish project branding and name** — "Easy VCF Editor", with updated logo/navbar and README. - Assigned to Andreina

- [~] **Wrap the app in Electron** — Scaffolded and building via `vite-plugin-electron`. - Assigned to Andreina
  - [x] `electron/main.ts` (secure `BrowserWindow`: `contextIsolation`, no `nodeIntegration`, `sandbox`).
  - [x] `electron/preload.ts` exposing `window.electronAPI` via `contextBridge`.
  - [x] Build integrated into `vite.config.ts` (`--mode electron`): main → ESM `main.js`, preload → CJS `preload.cjs`.
  - [x] Fix the sandbox/preload format bug (sandboxed preload must be CommonJS).
  - [x] electron-builder config (`appId`, Windows NSIS target) in `package.json`.
  - [ ] `npm install` (pull the Electron binary + `vite-plugin-electron`).
  - [ ] Verify `npm run electron:dev` opens a window and `window.electronAPI.isElectron === true`.
  - [ ] Produce and smoke-test the NSIS installer via `npm run electron:build`.

- [x] **Add PWA support** — Implemented with `vite-plugin-pwa`. - Assigned to Andreina
  - [x] Manifest, `registerType: "autoUpdate"`, workbox (`skipWaiting`/`clientsClaim`).
  - [x] Install-prompt UX (`use-pwa-install.ts` / `install-pwa-hint.tsx`).
  - [x] Disabled inside Electron builds (`disable: isElectron`).
  - [ ] Generate raster PNG icons (192/512 + apple-touch) via `@vite-pwa/assets-generator` (manifest currently SVG-only).
  - [ ] (Optional) Update/offline-ready toast via `virtual:pwa-register` (app already uses `sonner`).
  - [ ] Verify installability and offline behavior in a production preview.
