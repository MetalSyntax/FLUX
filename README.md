<div align="center">
<img width="1200" height="475" alt="GlassReader Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 📖 GlassReader

### Premium Manga & E-Book Library

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://web.dev/progressive-web-apps/)

**GlassReader** is a modern, privacy-focused, and visually stunning web-based reader for mangas, comics, and electronic books. Built with a sleek glassmorphic aesthetic, it provides a seamless reading experience directly in your browser.

[Features](#features) • [Format Support](#format-support) • [Installation](#installation) • [Privacy First](#privacy-first)

</div>

---

## ✨ Features

- **💎 Stunning UI/UX**: Immerse yourself in a premium glassmorphic interface with smooth transitions and deep customization.
- **📚 Library Management**: Organize your collection, search through your titles, and track your reading progress effortlessly.
- **🌙 Multiple Themes**: Switch between **Glass Dark**, **AMOLED Black**, and **Crystal White** modes to suit your environment.
- **📈 Progress Tracking**: Never lose your place. GlassReader automatically saves your current page and remembers where you left off.
- **📱 Responsive & PWA**: Optimized for mobile, tablet, and desktop. Install it as a PWA for a full-screen native experience.
- **⚡ Performance First**: Blazing fast loading speeds and smooth page transitions powered by Vite and React 19.

## 📁 Format Support

GlassReader handles your favorite formats with ease:

- **Mangas/Comics**: `.cbr`, `.cbz`
- **E-Books**: `.epub`
- **Documents**: `.pdf`

## 🛡️ Privacy First

Your library stays **yours**.

- **Local Storage**: All files and reading progress are stored locally in your browser using IndexedDB.
- **No Cloud Required**: No accounts, no tracking, and no data leaves your device.
- **Offline Ready**: Once loaded, read your favorite books even without an internet connection.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MetalSyntax/GlassReader.git
   cd GlassReader
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Framework**: [React 19](https://reactjs.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with Modern Glassmorphism
- **Reading Engines**:
  - [Epub.js](https://github.com/futurepress/epub.js/)
  - [PDF.js](https://mozilla.github.io/pdf.js/)
  - [Unrar.js](https://github.com/40thief/unrar-js) / JSZip
- **Database**: IndexedDB (via Browser API)

---

<div align="center">
Crafted with ❤️ by GlassReader Team
</div>
