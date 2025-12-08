# easy-vcf-editor – TODO

This file tracks missing features, improvements, and tech debt for the vCard editor.

## Current feature snapshot (what you already have)

- **Interactive vCard form** powered by React Hook Form and `VCardData` type
- **Support for vCard versions 2.1, 3.0, 4.0** with version selector and version-aware `generateVcf`
- **Visual contact preview** with structured layout and empty state
- **VCF code preview** with copy-to-clipboard and empty state
- **Import / Export** of single-contact `.vcf` files via `parseVcf` / `downloadVcf`
- **Base64 image support** for `PHOTO` and `LOGO` (data URIs or URLs) with help tooltips
- **Shadcn UI + Tailwind**-based layout and theming, including dark mode toggle
- **Type-safe vCard model** (`VCardData`, `VCardVersion`, typed enums for phones/emails/URLs/etc.)

---

## High-priority features & fixes

- [ ] **Form validation with Zod + React Hook Form**
  - [ ] Define a `VCardSchema` in `/src/types` or `/src/lib` using Zod
  - [ ] Enforce required structure for `N` and `FN` based on `VCardVersion`
  - [ ] Validate emails, phone numbers (basic patterns), URLs
  - [ ] Use `isValidImageSource` from `base64-utils` to validate `photo` and `logo` fields
  - [ ] Surface validation errors inline in `ContactForm`

- [ ] **vCard 2.1/3.0/4.0 correctness pass**
  - [ ] Audit `generateVcf` for each version against RFCs (esp. 2.1 edge cases)
  - [ ] Make `parseVcf` version-aware (read `VERSION:` line and parse accordingly)
  - [ ] Ensure `PHOTO`/`LOGO` handling is correct for data URIs and legacy `ENCODING=b` cases
  - [ ] Confirm `GEO`, `EMAIL`, and type parameters match expectations for 2.1 vs 3.0 vs 4.0

- [ ] **Import robustness**
  - [ ] Handle multi-line / folded properties more thoroughly
  - [ ] Gracefully ignore unsupported or unknown properties, but surface them as custom fields when possible
  - [ ] Add basic error messaging for clearly malformed files (e.g. missing `BEGIN:VCARD` / `END:VCARD`)

- [ ] **Lint and TypeScript cleanup**
  - [ ] Fix remaining `implicit any` warnings in `contact-preview.tsx` (type the map callbacks)
  - [ ] Run `npm run lint` regularly and keep the project clean
  - [ ] Optionally enable stricter TS ESLint configs as hinted in `README.md`

- [ ] **Project-level documentation**
  - [ ] Replace the Vite template `README.md` with real project docs:
    - [ ] What the app is, why it exists
    - [ ] Supported vCard versions & fields
    - [ ] How import/export behaves
    - [ ] Offline/PWA/Electron story (once implemented)

---

## Offline-first, PWA, and desktop (from .windsurfrules)

- [ ] **PWA polish**
  - [ ] Ensure `vite-plugin-pwa` is fully configured (manifest, icons, caching strategy)
  - [ ] Add an "Install app" hint somewhere in the UI if PWA is installable
  - [ ] Verify offline behavior: app shell loads and last-opened contact is available offline

- [ ] **Offline persistence**
  - [ ] Persist the current form data to `localStorage` (or IndexedDB) on change
  - [ ] Restore last session on load with a clear "Reset" action

- [ ] **Electron desktop wrapper**
  - [ ] Add minimal Electron shell around the existing React app
  - [ ] Wire build scripts for building a desktop binary (Windows first)
  - [ ] Share code between web PWA and Electron without diverging (single front-end)

---

## UX & usability improvements

- [ ] **Better onboarding / empty states**
  - [ ] Expand empty state messages with a short hint about versions and import
  - [ ] Optionally add a small "Sample contact" button to prefill a realistic vCard

- [ ] **Keyboard shortcuts and power-user features**
  - [ ] Shortcut to export (e.g. `Ctrl+S`)
  - [ ] Shortcut to toggle preview, and maybe navigate tabs

- [ ] **Advanced field helpers**
  - [ ] Small presets for common phone/email/url types
  - [ ] A structured editor for `LANG` (with dropdowns) instead of a raw string
  - [ ] Helper UI for `GEO` (lat/long) and `TZ` selection

- [ ] **Accessibility & i18n**
  - [ ] Pass through meaningful `aria-label`s on interactive icons and buttons
  - [ ] Audit color contrast and focus states
  - [ ] Consider basic i18n support (labels and tooltips) if you plan to localize

---

## Testing & quality

- [ ] **Unit tests with Vitest**
  - [ ] Add tests for `generateVcf` for v2.1, v3.0, v4.0 (golden-file style)
  - [ ] Add tests for `parseVcf` round-tripping simple contacts
  - [ ] Add tests for `base64-utils` and `isValidImageSource`

- [ ] **E2E or integration-level checks (future)**
  - [ ] Lightweight Playwright/Cypress-style smoke tests: load app, fill fields, export, re-import

---

## Nice-to-have / future ideas

- [ ] **Multi-contact VCF support** (parse and export multiple contacts in one file)
- [ ] **Template system** for common contact types (personal, work, company)
- [ ] **Share flows** (copy VCF to clipboard as file in supporting environments)
- [ ] **Theme customization** (allow user to pick accent color / density)
- [ ] **Metadata about exports** (simple history of last N exports, sizes, versions)

---

## What else you could do next

Short-term, high impact:
- Implement Zod validation + RHF integration
- Clean up remaining TypeScript/lint warnings
- Replace `README.md` with real app documentation

Medium-term:
- Solidify PWA/offline and start wiring an Electron shell
- Improve import robustness and vCard version correctness

Long-term:
- Add multi-contact support, templates, and deeper power-user tooling
- Consider tests and basic E2E coverage to keep refactors safe
