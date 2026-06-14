# FLUX

### Personal Reading App — Manga, Comics & E-Books

[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-00c08b.svg)](https://web.dev/progressive-web-apps/)

**FLUX** is a privacy-first, offline-capable reading app for manga, comics, and e-books. All data lives in your browser — no accounts, no servers, no tracking.

[Features](#features) • [Format Support](#format-support) • [Getting Started](#getting-started) • [Changelog](./CHANGELOG.md)

---

## Features

- **Glassmorphic UI** — Premium dark-first interface with smooth transitions and three themes: Dark, Black, and White.
- **Multilingual Support** — Fully localized into English, Spanish, and Portuguese.
- **Library Management** — Collections, favorites, renaming book titles, sort by title/author/date, grid and list views, search history.
- **Format Support** — Native readers for EPUB, PDF, CBR and CBZ.
- **EPUB E-Book Theming** — 4 distinct reading themes (Light, Sepia, Mint, Dark) and 4 customizable fonts.
- **Non-EPUB Zoom** — Corrected zoom capability for PDF and CBR/comics allowing fluid horizontal and vertical panning.
- **NSFW Content Blur** — Diffuse NSFW covers by default with a quick reveal toggle.
- **Interactive Storage Manager** — View local size files per book and export/download files in their original format.
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

<div align="center">
Built by <a href="https://metalsyntax.vercel.app">MetalSyntax</a>
</div>
