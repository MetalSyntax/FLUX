# Changelog

All notable changes to FLUX will be documented in this file.

## [1.1.0] — 2026-06-14

### Added
- **Integrated Toast Notification System**: Replaced browser `alert()` popups with custom, animated, glassmorphic toast notifications.
- **Multilingual Support**: Fully localized the user interface into English, Spanish, and Portuguese, selectable from the Profile page.
- **EPUB Book Theming**: Added 4 distinct reading themes (Light, Sepia, Mint, Dark) and 4 font choices (System Sans, Serif, Dyslexic/Outfit, Monospace) in the Reader View.
- **Visual NSFW Blur Filter**: Added an option to tag books as NSFW. Their covers are blurred in the library by default, with a click-to-reveal visual overlay and a global NSFW visibility toggle in the Profile.
- **Storage Details Popup**: Replaced the static Storage Usage text with an interactive detailed modal listing books, thumbnails, and sizes.
- **Original Format Export**: Enabled exporting/downloading books back in their original format (`.epub`, `.pdf`, `.cbr`, etc.) directly from the storage details modal.
- **Rename Book Title**: Added a "Rename" button to the book context menu to update titles inline.

### Fixed
- **Non-EPUB Zoom Magnification**: Fixed zoom controls for PDF and CBR books by scaling dimensions within an `overflow-auto` container, enabling fluid horizontal and vertical panning.

---

## [1.0.0] — 2026-06-10

- Implement DESIGN.md token system across the entire app: `--ui-*` CSS variables, `ui.*` Tailwind color namespace, theme-aware glass utilities.
- Remove all hardcoded blue-tinted colors (`#0b0e1a`, `#1a1d2e`, slate-*) in favor of design palette.
- Fix Material Symbols icons (add Google Fonts `<link>` to `index.html`).
- Fix search input active state color (was blue, now uses primary aqua).
- Change default avatar to Lorelei (DiceBear).
- Add auto-scroll-to-top on view change.

---

## [0.9.0]

- Add Terms & Conditions and Privacy Policy views accessible from Profile.
- Add developer portfolio link in legal views.
- Add GitHub update checker with modal prompt and manual check button in Settings.

---

## [0.8.0]

- Cache Gutenberg results in Discover to eliminate repeated load times.
- Change CORS proxy from corsproxy.io to codetabs for Gutenberg downloads.
- Replace browser download alert with in-app toast notification.

---

## [0.7.0]

- Add in-app search against Project Gutenberg API.
- Add Anna's Archive and Library Genesis external search links.
- Add Stats view with reading metrics.
- Add bottom nav labels.

---

## [0.6.0] — FLUX v2 rewrite

- Full rewrite: React 19 + TypeScript + Tailwind CSS + Vite.
- New reader engines for EPUB, PDF, CBR/CBZ.
- Reading sessions, daily goal ring, streak tracking.
- Collections, favorites, sort and filter.
- PWA manifest, offline support, transparent favicons.
- EPUB opens at saved CFI position with page-turn animations.

---

## [0.1.0] — GlassReader

- Initial project setup under the name GlassReader.
- Basic document reader with glassmorphic UI.
