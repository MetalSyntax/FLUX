import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, BookType, UserSettings, Bookmark } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ePub, { Rendition } from 'epubjs';
import JSZip from 'jszip';
// @ts-ignore
import { createExtractorFromData } from 'node-unrar-js';
import unrarWasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';
import { Buffer } from 'buffer';
import * as db from '../db';
import { getTranslation } from '../translations';

// @ts-ignore
window.Buffer = Buffer;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ReaderViewProps {
  book: Book;
  settings: UserSettings;
  onClose: () => void;
  onProgressUpdate: (bookId: string, page: number, total?: number, cover?: string, cfi?: string) => void;
}

const BOOKMARK_COLORS = ['var(--color-primary)', 'var(--color-purple)', 'var(--color-red)', 'var(--color-green)', 'var(--color-favorite)'];

const EPUB_THEMES = [
  { name: 'Light', bg: '#ffffff', text: '#1a1a1a' },
  { name: 'Sepia', bg: '#f5eccd', text: '#433422' },
  { name: 'Mint', bg: '#f0f7f4', text: '#2d4a3e' },
  { name: 'Dark', bg: '#0f172a', text: '#cbd5e1' },
];

const EPUB_FONTS = [
  { name: 'System Sans', family: 'system-ui, -apple-system, sans-serif' },
  { name: 'Serif (Georgia)', family: 'Georgia, serif' },
  { name: 'Dyslexic/Outfit', family: "'Outfit', 'Inter', sans-serif" },
  { name: 'Monospace', family: "'Courier New', Courier, monospace" },
];

const ReaderView: React.FC<ReaderViewProps> = ({ book, settings, onClose, onProgressUpdate }) => {
  const t = getTranslation(settings.language || 'en');

  const [currentPage, setCurrentPage] = useState(book.currentPage || 1);
  const [totalPages, setTotalPages] = useState(book.totalPages || 0);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  // EPUB themes and fonts state
  const [epubThemeIdx, setEpubThemeIdx] = useState(() => {
    const saved = localStorage.getItem('flux_epub_theme_idx');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [epubFontIdx, setEpubFontIdx] = useState(() => {
    const saved = localStorage.getItem('flux_epub_font_idx');
    return saved ? parseInt(saved, 10) : 0;
  });

  const activeEpubTheme = EPUB_THEMES[epubThemeIdx] || EPUB_THEMES[0];
  const activeEpubFont = EPUB_FONTS[epubFontIdx] || EPUB_FONTS[0];

  // New v2 state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [doublePage, setDoublePage] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [scrollPages, setScrollPages] = useState<string[]>([]);
  const [renderingScroll, setRenderingScroll] = useState(false);

  // PDF Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTokenRef = useRef(0);

  // EPUB Refs
  const epubViewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<Rendition | null>(null);

  // CBR images
  const [comicImages, setComicImages] = useState<string[]>([]);

  // Touch/swipe refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Session tracking refs
  const sessionStartRef = useRef({ time: Date.now(), page: book.currentPage || 1 });
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  const themeColors = {
    dark: { bg: 'var(--ui-bg)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)' },
    black: { bg: 'var(--ui-bg)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)' },
    white: { bg: 'var(--ui-bg)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)' },
  };
  const ct = themeColors[settings.theme] || themeColors.dark;

  // ── Load bookmarks ────────────────────────────────────────────────────
  useEffect(() => {
    db.getBookmarks(book.id).then(setBookmarks);
  }, [book.id]);

  // ── Session save on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      const pagesRead = Math.abs(currentPageRef.current - sessionStartRef.current.page);
      const duration = Date.now() - sessionStartRef.current.time;
      if (duration > 30000 || pagesRead > 0) {
        db.saveSession({
          id: crypto.randomUUID(),
          bookId: book.id,
          startTime: sessionStartRef.current.time,
          endTime: Date.now(),
          pagesRead,
        });
      }
    };
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, totalPages, isPageTurning]);

  // ── Load book ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadBook = async () => {
      if (!book.file) {
        setError(settings.language === 'es' ? 'Archivo no encontrado.' : settings.language === 'pt' ? 'Arquivo não encontrado.' : 'File not found. Please re-add this book to your library.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const arrayBuffer = await book.file.arrayBuffer();

        if (book.type === BookType.PDF) {
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          // Extract cover from page 1
          try {
            const p1 = await pdf.getPage(1);
            const cv = document.createElement('canvas');
            const vp = p1.getViewport({ scale: 0.5 });
            cv.height = vp.height; cv.width = vp.width;
            await p1.render({ canvasContext: cv.getContext('2d')!, viewport: vp, canvas: cv }).promise;
            onProgressUpdate(book.id, currentPage, pdf.numPages, cv.toDataURL());
          } catch { /* cover optional */ }
          setLoading(false);
        }
        else if (book.type === BookType.EPUB) {
          const epub = ePub(arrayBuffer);
          bookRef.current = epub;
          epub.coverUrl().then(async (url) => {
            if (url) {
              try {
                const blob = await fetch(url).then((r) => r.blob());
                const reader = new FileReader();
                reader.onloadend = () => onProgressUpdate(book.id, currentPage, totalPages, reader.result as string);
                reader.readAsDataURL(blob);
              } catch { /* optional */ }
            }
          });
          setTimeout(async () => {
            if (!epubViewerRef.current) return;
            const rendition = epub.renderTo(epubViewerRef.current, {
              width: '100%', height: '100%', flow: scrollMode ? 'scrolled-doc' : 'paginated',
              manager: 'default', allowScriptedContent: true,
            });
            renditionRef.current = rendition;
            applyEpubTheme(rendition);

            // Show the viewer only after the first page is fully laid out
            let firstRender = true;
            rendition.on('rendered', () => {
              if (firstRender) {
                firstRender = false;
                setLoading(false);
              }
            });

            // Restore saved position (CFI) or start from beginning
            if (book.currentCfi) {
              await rendition.display(book.currentCfi);
            } else {
              await rendition.display();
            }

            rendition.on('click', (e: any) => {
              const x = e.clientX;
              const w = window.innerWidth;
              if (x < w * 0.3) goToPrev();
              else if (x > w * 0.7) goToNext();
              else setShowControls((p) => !p);
            });
            epub.locations.generate(1000).then(() => setTotalPages(epub.locations.length()));
            rendition.on('relocated', (location: any) => {
              const cfi = location.start.cfi;
              try {
                if (epub.locations && epub.locations.length() > 0) {
                  const pct = epub.locations.percentageFromCfi(cfi);
                  const newPage = Math.floor(pct * epub.locations.length()) + 1;
                  setCurrentPage(newPage);
                  onProgressUpdate(book.id, newPage, epub.locations.length(), undefined, cfi);
                } else {
                  onProgressUpdate(book.id, currentPage, undefined, undefined, cfi);
                }
              } catch {
                onProgressUpdate(book.id, currentPage, undefined, undefined, cfi);
              }
            });
          }, 100);
        }
        else if (book.type === BookType.CBR) {
          const images: { name: string; url: string }[] = [];
          const fileName = book.file.name.toLowerCase();
          if (fileName.endsWith('.cbz') || !fileName.endsWith('.cbr')) {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const promises: Promise<void>[] = [];
            zip.forEach((path, file) => {
              if (path.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i)) {
                promises.push((async () => {
                  const blob = await file.async('blob');
                  images.push({ name: path, url: URL.createObjectURL(blob) });
                })());
              }
            });
            await Promise.all(promises);
          } else {
            const wasmRes = await fetch(unrarWasmUrl);
            const wasmBinary = await wasmRes.arrayBuffer();
            const extractor = await createExtractorFromData({ data: arrayBuffer, wasmBinary });
            
            const list = extractor.getFileList();
            const fileHeaders = [...list.fileHeaders].filter((f: any) => !f.flags.directory && f.name.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i));
            
            const extracted = extractor.extract({ files: fileHeaders.map((f: any) => f.name) });
            const extractedFiles = [...extracted.files];
            
            for (const file of extractedFiles) {
              if (file.extraction) {
                images.push({ name: file.fileHeader.name, url: URL.createObjectURL(new Blob([file.extraction])) });
              }
            }
          }
          images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
          const urls = images.map((i) => i.url);
          setComicImages(urls);
          setTotalPages(urls.length);
          if (urls[0]) {
            try {
              const blob = await fetch(urls[0]).then((r) => r.blob());
              const reader = new FileReader();
              reader.onloadend = () => onProgressUpdate(book.id, currentPage, urls.length, reader.result as string);
              reader.readAsDataURL(blob);
            } catch { /* optional */ }
          }
          setLoading(false);
        }
      } catch (err: any) {
        setError(t.errorLoading + err.message);
        setLoading(false);
      }
    };
    loadBook();
    return () => {
      if (bookRef.current) bookRef.current.destroy();
      comicImages.forEach((src) => URL.revokeObjectURL(src));
    };
  }, [book]);

  const applyEpubTheme = (rendition: Rendition) => {
    rendition.themes.default({
      html: {
        'background-image': 'none !important',
      },
      body: {
        'background-color': `${activeEpubTheme.bg} !important`,
        'background-image': 'none !important',
        'color': `${activeEpubTheme.text} !important`,
        'font-family': `${activeEpubFont.family} !important`,
        'padding': '0 40px !important',
      },
      p: { 'line-height': '1.6 !important', 'margin-bottom': '1em !important' }
    });
    rendition.themes.fontSize(`${fontSize}%`);
  };

  useEffect(() => {
    if (renditionRef.current) applyEpubTheme(renditionRef.current);
    localStorage.setItem('flux_epub_theme_idx', String(epubThemeIdx));
    localStorage.setItem('flux_epub_font_idx', String(epubFontIdx));
  }, [epubThemeIdx, epubFontIdx, fontSize]);

  useEffect(() => {
    const updateEpubFlow = async () => {
      if (!loading && book.type === BookType.EPUB && renditionRef.current && bookRef.current && epubViewerRef.current) {
        const currentCfi = renditionRef.current.location?.start?.cfi;
        renditionRef.current.destroy();
        epubViewerRef.current.innerHTML = '';
        const rendition = bookRef.current.renderTo(epubViewerRef.current, {
          width: '100%', height: '100%', flow: scrollMode ? 'scrolled-doc' : 'paginated',
          manager: 'default', allowScriptedContent: true,
        });
        renditionRef.current = rendition;
        applyEpubTheme(rendition);
        
        rendition.on('click', (e: any) => {
          const x = e.clientX;
          const w = window.innerWidth;
          if (x < w * 0.3) goToPrev();
          else if (x > w * 0.7) goToNext();
          else setShowControls((p) => !p);
        });
        
        rendition.on('relocated', (location: any) => {
          const cfi = location.start.cfi;
          try {
            if (bookRef.current.locations && bookRef.current.locations.length() > 0) {
              const pct = bookRef.current.locations.percentageFromCfi(cfi);
              const newPage = Math.floor(pct * bookRef.current.locations.length()) + 1;
              setCurrentPage(newPage);
              onProgressUpdate(book.id, newPage, bookRef.current.locations.length(), undefined, cfi);
            } else {
              onProgressUpdate(book.id, currentPage, undefined, undefined, cfi);
            }
          } catch {
            onProgressUpdate(book.id, currentPage, undefined, undefined, cfi);
          }
        });

        if (currentCfi) {
          await rendition.display(currentCfi);
        }
      }
    };
    updateEpubFlow();
  }, [scrollMode]);

  const renderPdfPage = async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    const token = ++renderTokenRef.current;
    const page = await pdfDocRef.current.getPage(pageNumber);
    if (token !== renderTokenRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const vp = page.getViewport({ scale: 1.5 });
    canvas.height = vp.height; canvas.width = vp.width;
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  };

  useEffect(() => {
    if (book.type === BookType.PDF && !scrollMode) renderPdfPage(currentPage);
    onProgressUpdate(book.id, currentPage, totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (book.type === BookType.PDF && !scrollMode) renderPdfPage(currentPage);
  }, [zoom]);

  // ── Scroll mode: pre-render all pages as data URLs ────────────────────
  useEffect(() => {
    if (!scrollMode || book.type !== BookType.PDF || !pdfDocRef.current) return;
    const renderAll = async () => {
      setRenderingScroll(true);
      const urls: string[] = [];
      const total = Math.min(pdfDocRef.current!.numPages, 30);
      for (let i = 1; i <= total; i++) {
        const page = await pdfDocRef.current!.getPage(i);
        const cv = document.createElement('canvas');
        const vp = page.getViewport({ scale: 1.2 });
        cv.width = vp.width; cv.height = vp.height;
        await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp, canvas: cv }).promise;
        urls.push(cv.toDataURL('image/jpeg', 0.85));
        setScrollPages([...urls]);
        await new Promise(r => setTimeout(r, 10));
      }
      setScrollPages(urls);
      setRenderingScroll(false);
    };
    renderAll();
  }, [scrollMode]);

  // ── Navigation ────────────────────────────────────────────────────────
  const pageStep = doublePage && book.type === BookType.CBR ? 2 : 1;

  const goToNext = useCallback(() => {
    if (currentPage + pageStep - 1 >= totalPages || isPageTurning) return;
    setTurnDirection('next');
    setIsPageTurning(true);
    setTimeout(() => {
      if (book.type === BookType.EPUB && renditionRef.current) renditionRef.current.next();
      else setCurrentPage((p) => Math.min(p + pageStep, totalPages));
      setIsPageTurning(false);
      setIsEntering(true);
      setTimeout(() => setIsEntering(false), 500);
    }, 350);
  }, [currentPage, totalPages, isPageTurning, pageStep]);

  const goToPrev = useCallback(() => {
    if (currentPage <= 1 || isPageTurning) return;
    setTurnDirection('prev');
    setIsPageTurning(true);
    setTimeout(() => {
      if (book.type === BookType.EPUB && renditionRef.current) renditionRef.current.prev();
      else setCurrentPage((p) => Math.max(p - pageStep, 1));
      setIsPageTurning(false);
      setIsEntering(true);
      setTimeout(() => setIsEntering(false), 500);
    }, 350);
  }, [currentPage, isPageTurning, pageStep]);

  // ── Swipe detection ───────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      if (deltaX < 0) goToNext();
      else goToPrev();
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1.05) {
      setShowControls((p) => !p);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w * 0.25) {
      goToPrev();
    } else if (x > w * 0.75) {
      goToNext();
    } else {
      setShowControls((p) => !p);
    }
  };

  // Bookmarks Logic
  const isBookmarkedOnCurrentPage = bookmarks.some((b) => b.page === currentPage);

  const addBookmark = async () => {
    const cfi = renditionRef.current?.location?.start?.cfi;
    const label = `${t.library} ${currentPage}`;
    const bm: Bookmark = {
      id: crypto.randomUUID(),
      bookId: book.id,
      page: currentPage,
      cfi,
      label,
      color: BOOKMARK_COLORS[bookmarks.length % BOOKMARK_COLORS.length],
      createdAt: Date.now(),
    };
    await db.saveBookmark(bm);
    setBookmarks((prev) => [...prev, bm]);
  };

  const removeBookmark = async (id: string) => {
    await db.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: book.title,
        text: `${settings.language === 'es' ? '¡Estoy leyendo' : settings.language === 'pt' ? 'Estou lendo' : 'I am reading'} "${book.title}" ${settings.language === 'es' ? 'en' : settings.language === 'pt' ? 'no' : 'on'} FLUX!`,
      });
    } catch { /* optional */ }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col select-none touch-none focus:outline-none overflow-hidden"
      style={{ backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg : 'var(--ui-bg)' }}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={book.type === BookType.EPUB ? { backgroundColor: activeEpubTheme.bg } : {}}
      >
        <style>{`
          .brightness-overlay {
            mix-blend-mode: multiply;
            background-color: rgb(0,0,0);
            pointer-events: none;
            position: absolute;
            inset: 0;
            z-index: 150;
            transition: opacity 0.3s ease;
          }
        `}</style>
        <div className="brightness-overlay" style={{ opacity: 1 - brightness / 100 }} />

        {loading && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm font-bold tracking-widest uppercase text-primary animate-pulse">{t.loadingBook}</p>
          </div>
        )}

        {error && (
          <div className="text-center px-6 max-w-sm space-y-4">
            <span className="material-symbols-outlined text-red-400 text-5xl font-light">warning</span>
            <p className="text-sm font-medium opacity-80">{error}</p>
            <button onClick={onClose} className="px-5 py-2.5 rounded-full bg-ui-bg-accented text-xs font-bold border border-ui-border">
              {settings.language === 'es' ? 'Volver' : settings.language === 'pt' ? 'Voltar' : 'Go Back'}
            </button>
          </div>
        )}

        {/* EPUB Viewer — always in DOM so epubViewerRef is available during setup */}
        {book.type === BookType.EPUB && (
          <div
            ref={epubViewerRef}
            className="absolute inset-0 transition-colors duration-300"
            style={{
              backgroundColor: activeEpubTheme.bg,
              opacity: loading ? 0 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
          />
        )}

        {!loading && !error && (
          <>
            {/* PDF — scroll mode */}
            {book.type === BookType.PDF && scrollMode && (
              <div className="w-full h-full overflow-y-auto py-6 px-4 space-y-4" onClick={() => setShowControls((p) => !p)}>
                {renderingScroll && scrollPages.length === 0 && (
                  <div className="flex justify-center py-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {scrollPages.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    className="shadow-lg rounded-lg bg-white mx-auto transition-all duration-200" 
                    style={{
                      width: zoom > 1 ? `${zoom * 100}%` : '100%',
                      maxWidth: zoom > 1 ? 'none' : '100%',
                    }}
                    alt={`Page ${i + 1}`} 
                  />
                ))}
                {pdfDocRef.current && pdfDocRef.current.numPages > 30 && (
                  <p className="text-center text-xs opacity-30 py-4">
                    {settings.language === 'es' ? 'El modo continuo muestra las primeras 30 páginas.' : settings.language === 'pt' ? 'O modo contínuo exibe as primeiras 30 páginas.' : 'Scroll mode shows the first 30 pages.'}
                  </p>
                )}
              </div>
            )}

            {/* PDF — paginated mode */}
            {book.type === BookType.PDF && !scrollMode && (
              <div className="page-flip flex items-center justify-center w-full h-full overflow-auto p-4" onClick={handlePageClick}>
                <div
                  className={`flex items-center justify-center transition-all duration-200 ${
                    isPageTurning
                      ? (turnDirection === 'next' ? 'page-flip-next-exit' : 'page-flip-prev-exit')
                      : (isEntering ? (turnDirection === 'next' ? 'page-flip-next-enter' : 'page-flip-prev-enter') : '')
                  }`}
                  style={{
                    width: `${zoom * 100}%`,
                    maxWidth: zoom > 1 ? 'none' : '100%',
                  }}
                >
                  <canvas ref={canvasRef} className="w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-lg bg-white" />
                </div>
              </div>
            )}

            {/* CBR/CBZ — scroll mode */}
            {book.type === BookType.CBR && scrollMode && (
              <div className="w-full h-full overflow-y-auto py-0 px-0 space-y-0 bg-black hide-scrollbar flex flex-col items-center" onClick={() => setShowControls((p) => !p)}>
                {comicImages.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    className="transition-all duration-200" 
                    style={{
                      width: zoom > 1 ? `${zoom * 100}%` : '100%',
                      maxWidth: zoom > 1 ? 'none' : '4xl',
                      objectFit: 'contain',
                    }}
                    alt={`Page ${i + 1}`} 
                    loading="lazy" 
                  />
                ))}
              </div>
            )}

            {/* CBR/CBZ — single page */}
            {book.type === BookType.CBR && !doublePage && !scrollMode && comicImages[currentPage - 1] && (
              <div className="relative h-full w-full flex items-center justify-center p-4 lg:p-10 page-flip overflow-auto" onClick={handlePageClick}>
                <img
                  key={currentPage}
                  src={comicImages[currentPage - 1]}
                  className={`shadow-[0_20px_80px_rgba(0,0,0,0.6)] rounded-sm transition-all duration-200 ${
                    isPageTurning
                      ? (turnDirection === 'next' ? 'page-flip-next-exit' : 'page-flip-prev-exit')
                      : (isEntering ? (turnDirection === 'next' ? 'page-flip-next-enter' : 'page-flip-prev-enter') : '')
                  }`}
                  style={{
                    width: zoom > 1 ? `${zoom * 100}%` : 'auto',
                    maxWidth: zoom > 1 ? 'none' : '100%',
                    maxHeight: zoom > 1 ? 'none' : '100%',
                    objectFit: 'contain',
                  }}
                  alt={`Page ${currentPage}`}
                />
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
              </div>
            )}

            {/* CBR/CBZ — double page */}
            {book.type === BookType.CBR && doublePage && !scrollMode && (
              <div className="relative h-full w-full flex items-center justify-center gap-1 p-2 lg:p-6 overflow-auto" onClick={handlePageClick}>
                {comicImages[currentPage - 1] && (
                  <img 
                    src={comicImages[currentPage - 1]} 
                    className="shadow-xl rounded-sm transition-all duration-200" 
                    style={{
                      width: zoom > 1 ? `${zoom * 49}%` : 'auto',
                      maxWidth: zoom > 1 ? 'none' : '49%',
                      maxHeight: zoom > 1 ? 'none' : '100%',
                      objectFit: 'contain',
                    }}
                    alt={`Page ${currentPage}`} 
                  />
                )}
                {comicImages[currentPage] && (
                  <img 
                    src={comicImages[currentPage]} 
                    className="shadow-xl rounded-sm transition-all duration-200" 
                    style={{
                      width: zoom > 1 ? `${zoom * 49}%` : 'auto',
                      maxWidth: zoom > 1 ? 'none' : '49%',
                      maxHeight: zoom > 1 ? 'none' : '100%',
                      objectFit: 'contain',
                    }}
                    alt={`Page ${currentPage + 1}`} 
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 inset-x-0 z-[120] px-4 sm:px-6 py-3 sm:py-4 transition-all duration-500 ease-out transform border-b ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ 
          backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg + 'd8' : ct.bg + 'd8', 
          color: book.type === BookType.EPUB ? activeEpubTheme.text : ct.text,
          borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
          backdropFilter: 'blur(16px)' 
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={onClose} 
              className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 border" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.15)' : ct.border 
              }}
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold truncate">{book.title}</h2>
              <p className="text-[10px] opacity-40 uppercase tracking-[0.15em] font-medium truncate">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Bookmark toggle */}
            <button
              onClick={addBookmark}
              className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border"
              style={isBookmarkedOnCurrentPage
                ? { backgroundColor: 'rgba(0, 192, 139, 0.15)', borderColor: 'rgba(0, 192, 139, 0.4)', color: 'var(--color-primary)' }
                : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.15)' : ct.border }
              }
            >
              <span className="material-symbols-outlined text-xl" style={isBookmarkedOnCurrentPage ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
            </button>

            {/* Bookmarks panel */}
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${showBookmarks ? 'bg-primary border-primary text-white' : ''}`}
              style={!showBookmarks ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.15)' : ct.border } : {}}
            >
              <span className="material-symbols-outlined text-xl">bookmarks</span>
            </button>

            {/* Share */}
            {navigator.share && (
              <button 
                onClick={handleShare} 
                className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border" 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.15)' : ct.border 
                }}
              >
                <span className="material-symbols-outlined text-xl">share</span>
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${showSettings ? 'bg-primary border-primary text-white' : ''}`}
              style={!showSettings ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.15)' : ct.border } : {}}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
          </div>
        </div>

        {/* Bookmarks Panel Drawer */}
        <div
          className={`absolute top-full right-4 sm:right-6 mt-4 w-72 rounded-3xl p-6 shadow-2xl transition-all duration-500 transform border z-[130] ${showBookmarks && showControls && !showSettings ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}
          style={{ 
            backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg : 'var(--ui-bg-elevated)', 
            borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
            color: book.type === BookType.EPUB ? activeEpubTheme.text : 'inherit'
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs font-bold uppercase tracking-widest">{t.bookmarks}</span>
            <span className="text-[10px] font-bold opacity-30">{bookmarks.length}</span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-8 text-center opacity-40">
              <span className="material-symbols-outlined text-3xl font-light mb-2">bookmark_border</span>
              <p className="text-[10px] font-medium">{t.noBookmarks}</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto mt-3 space-y-2 pr-1 hide-scrollbar">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/5 transition-all group">
                  <button
                    onClick={() => {
                      if (book.type === BookType.EPUB && renditionRef.current && bm.cfi) {
                        renditionRef.current.display(bm.cfi);
                      } else {
                        setCurrentPage(bm.page);
                      }
                      setShowBookmarks(false);
                    }}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: bm.color }} />
                    <div>
                      <p className="text-xs font-bold">{bm.label}</p>
                      <p className="text-[9px] opacity-30">{new Date(bm.createdAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                  <button onClick={() => removeBookmark(bm.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div
          className={`absolute top-full right-4 sm:right-6 mt-4 w-72 rounded-3xl p-6 space-y-6 shadow-2xl transition-all duration-500 transform border z-[130] ${showSettings && showControls && !showBookmarks ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}
          style={{ 
            backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg : 'var(--ui-bg-elevated)', 
            borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
            color: book.type === BookType.EPUB ? activeEpubTheme.text : 'inherit'
          }}
        >
          {/* Brightness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.brightness}</span>
              <span className="text-xs font-bold text-primary">{brightness}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg opacity-20">light_mode</span>
              <input type="range" min="30" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
              <span className="material-symbols-outlined text-lg opacity-20">brightness_high</span>
            </div>
          </div>

          {/* Zoom (PDF / CBR) */}
          {book.type !== BookType.EPUB && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.zoom}</span>
                <span className="text-xs font-bold text-primary">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.8, Math.round((prev - 0.1) * 10) / 10))}
                  className="size-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-primary active:scale-90"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-lg">zoom_out</span>
                </button>
                <input type="range" min="0.8" max="2.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10))}
                  className="size-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-primary active:scale-90"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </button>
              </div>
            </div>
          )}

          {/* Font size (EPUB) */}
          {book.type === BookType.EPUB && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.fontSize}</span>
                <span className="text-xs font-bold text-primary">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(60, prev - 10))}
                  className="size-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-primary font-bold text-xs active:scale-90"
                  title="Decrease Size"
                >
                  A-
                </button>
                <input type="range" min="60" max="200" step="10" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(200, prev + 10))}
                  className="size-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-primary font-bold text-base active:scale-90"
                  title="Increase Size"
                >
                  A+
                </button>
              </div>
            </div>
          )}

          {/* EPUB Reading Theme */}
          {book.type === BookType.EPUB && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{settings.language === 'es' ? 'Tema del Libro' : settings.language === 'pt' ? 'Tema do Livro' : 'Book Theme'}</span>
              <div className="grid grid-cols-4 gap-2">
                {EPUB_THEMES.map((theme, idx) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => setEpubThemeIdx(idx)}
                    className="h-8 rounded-lg flex items-center justify-center border font-bold text-[10px] transition-all active:scale-95"
                    style={{
                      backgroundColor: theme.bg,
                      color: theme.text,
                      borderColor: epubThemeIdx === idx ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                      boxShadow: epubThemeIdx === idx ? '0 0 0 2px var(--color-primary)' : 'none',
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EPUB Reading Font */}
          {book.type === BookType.EPUB && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{settings.language === 'es' ? 'Tipografía' : settings.language === 'pt' ? 'Tipografia' : 'Typography'}</span>
              <div className="grid grid-cols-2 gap-2">
                {EPUB_FONTS.map((font, idx) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setEpubFontIdx(idx)}
                    className={`py-1.5 px-2 rounded-lg border text-[10px] transition-all active:scale-95 text-left truncate`}
                    style={{
                      fontFamily: font.family,
                      borderColor: epubFontIdx === idx ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                      backgroundColor: epubFontIdx === idx ? 'rgba(0, 192, 139, 0.1)' : 'transparent',
                      color: epubFontIdx === idx ? 'var(--color-primary)' : 'inherit',
                    }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scroll mode (PDF / EPUB / CBR) */}
          {(book.type === BookType.PDF || book.type === BookType.EPUB || book.type === BookType.CBR) && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.scrollMode}</p>
                <p className="text-[9px] opacity-20 mt-0.5">{t.scrollModeDesc}</p>
              </div>
              <button
                onClick={() => setScrollMode((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors ${scrollMode ? 'bg-primary' : 'bg-ui-bg-accented'}`}
              >
                <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${scrollMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}

          {/* Double page (CBR only) */}
          {book.type === BookType.CBR && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t.doublePage}</p>
                <p className="text-[9px] opacity-20 mt-0.5">{t.doublePageDesc}</p>
              </div>
              <button
                onClick={() => setDoublePage((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors ${doublePage ? 'bg-primary' : 'bg-ui-bg-accented'}`}
              >
                <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${doublePage ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Bar ────────────────────────────────────────────────────── */}
      {!loading && !error && !scrollMode && (
        <div
          className={`fixed bottom-0 inset-x-0 z-[110] px-4 sm:px-6 py-6 sm:py-8 pb-10 sm:pb-12 transition-all duration-500 ease-out transform border-t ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
          style={{ 
            backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg + 'd8' : ct.bg + 'd8', 
            color: book.type === BookType.EPUB ? activeEpubTheme.text : ct.text,
            borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
            backdropFilter: 'blur(16px)' 
          }}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex justify-between items-center px-2">
              <button onClick={goToPrev} disabled={currentPage === 1} className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100 disabled:opacity-20">
                <span className="material-symbols-outlined text-base">chevron_left</span> {t.prev}
              </button>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border shadow-lg" style={{ backgroundColor: 'rgba(0, 192, 139, 0.15)', borderColor: 'rgba(0, 192, 139, 0.3)', color: 'var(--color-primary)' }}>
                  {currentPage} <span className="opacity-40 mx-1">/</span> {totalPages}
                </span>
                {totalPages > 0 && <span className="text-[8px] opacity-30 font-bold uppercase tracking-widest">{Math.round((currentPage / totalPages) * 100)}%</span>}
              </div>
              <button onClick={goToNext} disabled={currentPage >= totalPages} className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100 disabled:opacity-20">
                {t.next} <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
            <div className="px-2">
              <input
                type="range" min="1" max={totalPages || 1} value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (book.type === BookType.EPUB && renditionRef.current && bookRef.current) {
                    const cfi = bookRef.current.locations.cfiFromPercentage((val - 1) / totalPages);
                    renditionRef.current.display(cfi);
                  } else setCurrentPage(val);
                }}
                className="w-full h-1.5 bg-current opacity-20 rounded-full appearance-none accent-primary cursor-pointer hover:h-2 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Zoom In / Zoom Out Overlay Controls */}
      {showControls && !loading && !error && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[115] flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <button
            onClick={() => {
              if (book.type === BookType.EPUB) {
                setFontSize(prev => Math.min(200, prev + 10));
              } else {
                setZoom(prev => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10));
              }
            }}
            className="size-12 rounded-2xl border flex items-center justify-center text-primary active:scale-90 transition-all shadow-2xl hover:bg-white/10"
            style={{ 
              backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg : ct.bg, 
              color: 'var(--color-primary)',
              borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
              backdropFilter: 'blur(12px)' 
            }}
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-2xl">zoom_in</span>
          </button>
          <button
            onClick={() => {
              if (book.type === BookType.EPUB) {
                setFontSize(prev => Math.max(60, prev - 10));
              } else {
                setZoom(prev => Math.max(0.8, Math.round((prev - 0.1) * 10) / 10));
              }
            }}
            className="size-12 rounded-2xl border flex items-center justify-center text-primary active:scale-90 transition-all shadow-2xl hover:bg-white/10"
            style={{ 
              backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg : ct.bg, 
              color: 'var(--color-primary)',
              borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border,
              backdropFilter: 'blur(12px)' 
            }}
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-2xl">zoom_out</span>
          </button>
        </div>
      )}

      {/* Mini progress indicator when controls are hidden */}
      {!showControls && !loading && !error && (
        <div className="fixed bottom-10 right-8 z-[110] animate-in fade-in slide-in-from-right-4 duration-500">
          <div 
            className="px-4 py-2 flex items-center gap-3 border shadow-2xl rounded-full" 
            style={{ 
              backgroundColor: book.type === BookType.EPUB ? activeEpubTheme.bg + 'd8' : ct.glass, 
              color: book.type === BookType.EPUB ? activeEpubTheme.text : 'inherit',
              borderColor: book.type === BookType.EPUB ? 'rgba(0,0,0,0.1)' : ct.border, 
              backdropFilter: 'blur(12px)' 
            }}
          >
            <span className="text-[10px] font-bold tracking-widest">{currentPage} / {totalPages}</span>
            {totalPages > 0 && (
              <span className="text-[9px] font-extrabold text-primary">
                {Math.round((currentPage / totalPages) * 100)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
