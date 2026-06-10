# FLUX

### Personal Reading App — Manga, Comics & E-Books

[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-00c08b.svg)](https://web.dev/progressive-web-apps/)

**FLUX** is a privacy-first, offline-capable reading app for manga, comics, and e-books. All data lives in your browser — no accounts, no servers, no tracking.

[Features](#features) • [Format Support](#format-support) • [Getting Started](#getting-started) • [Changelog](#changelog)

---

## Features

- **Glassmorphic UI** — Premium dark-first interface with smooth transitions and three themes: Dark, Black, and White.
- **Library Management** — Collections, favorites, sort by title/author/date, grid and list views, search history.
- **Format Support** — Native readers for EPUB, PDF, CBR and CBZ.
- **Reading Stats** — Track daily pages, weekly minutes, streaks, and completed books.
- **Discover** — Browse and download free classics from Project Gutenberg directly into your library.
- **PWA** — Install as a native app on any device. Works fully offline after first load.
- **Privacy First** — Everything stored locally in IndexedDB. Nothing leaves your device.

## Format Support

| Format | Type | Engine |
|--------|------|--------|
| `.epub` | E-Book | Epub.js |
| `.pdf` | Document | PDF.js |
| `.cbr` | Manga / Comic | node-unrar-js |
| `.cbz` | Manga / Comic | JSZip |

## Getting Started

```bash
# Clone
git clone https://github.com/MetalSyntax/FLUX.git
cd FLUX

# Install dependencies
pnpm install

# Dev server (port 4002)
pnpm dev

# Production build
pnpm build
```

## Tech Stack

- **Framework**: React 19
- **Bundler**: Vite 6
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 3 + CSS custom properties design token system
- **Icons & Font**: Material Symbols Outlined, Inter — Google Fonts
- **Storage**: IndexedDB (Browser API)
- **PWA**: vite-plugin-pwa + Workbox

---

## Changelog

### v1.0.0 — 2026-06-10

- Implement DESIGN.md token system across the entire app: `--ui-*` CSS variables, `ui.*` Tailwind color namespace, theme-aware glass utilities
- Remove all hardcoded blue-tinted colors (`#0b0e1a`, `#1a1d2e`, slate-*) in favor of design palette
- Fix Material Symbols icons (add Google Fonts `<link>` to `index.html`)
- Fix search input active state color (was blue, now uses primary aqua)
- Change default avatar to Lorelei (DiceBear)
- Add auto-scroll-to-top on view change

### v0.9.0

- Add Terms & Conditions and Privacy Policy views accessible from Profile
- Add developer portfolio link in legal views
- Add GitHub update checker with modal prompt and manual check button in Settings

### v0.8.0

- Cache Gutenberg results in Discover to eliminate repeated load times
- Change CORS proxy from corsproxy.io to codetabs for Gutenberg downloads
- Replace browser download alert with in-app toast notification

### v0.7.0

- Add in-app search against Project Gutenberg API
- Add Anna's Archive and Library Genesis external search links
- Add Stats view with reading metrics
- Add bottom nav labels

### v0.6.0 — FLUX v2 rewrite

- Full rewrite: React 19 + TypeScript + Tailwind CSS + Vite
- New reader engines for EPUB, PDF, CBR/CBZ
- Reading sessions, daily goal ring, streak tracking
- Collections, favorites, sort and filter
- PWA manifest, offline support, transparent favicons
- EPUB opens at saved CFI position with page-turn animations

### v0.1.0 — GlassReader

- Initial project setup under the name GlassReader
- Basic document reader with glassmorphic UI

---

<div align="center">
Built by <a href="https://metalsyntax.vercel.app">MetalSyntax</a>
</div>
