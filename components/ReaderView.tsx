
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, BookType, UserSettings, Bookmark } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ePub, { Rendition } from 'epubjs';
import JSZip from 'jszip';
// @ts-ignore
import { createExtractorFromData } from 'unrar-js';
import { Buffer } from 'buffer';
import * as db from '../db';

// @ts-ignore
window.Buffer = Buffer;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ReaderViewProps {
  book: Book;
  settings: UserSettings;
  onClose: () => void;
  onProgressUpdate: (bookId: string, page: number, total?: number, cover?: string, cfi?: string) => void;
}

const BOOKMARK_COLORS = ['#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#f59e0b'];

const ReaderView: React.FC<ReaderViewProps> = ({ book, settings, onClose, onProgressUpdate }) => {
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

  // EPUB Refs
  const epubViewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<any>(null);

  // CBR/CBZ
  const [comicImages, setComicImages] = useState<string[]>([]);

  // Touch/swipe refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Render token — cancels stale PDF renders when page changes quickly
  const renderTokenRef = useRef(0);

  // Session tracking refs
  const sessionStartRef = useRef({ time: Date.now(), page: book.currentPage || 1 });
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  const themeColors = {
    dark: { bg: '#0b0e1a', text: '#ffffff', glass: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
    black: { bg: '#000000', text: '#ffffff', glass: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
    white: { bg: '#ffffff', text: '#0f172a', glass: 'rgba(15,23,42,0.05)', border: 'rgba(15,23,42,0.1)' },
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
        setError('File not found. Please re-add this book to your library.');
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
          // Initial render is handled by the useEffect below (triggered by setTotalPages).
          // Calling it again here with a stale closure value of currentPage would
          // overwrite the correct page if the user navigated while the PDF was loading.
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
              if (path.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                promises.push((async () => {
                  const blob = await file.async('blob');
                  images.push({ name: path, url: URL.createObjectURL(blob) });
                })());
              }
            });
            await Promise.all(promises);
          } else {
            const extractor = await createExtractorFromData({ data: arrayBuffer });
            const extracted = extractor.extractAll();
            for (const file of extracted.files) {
              if (file.fileHeader.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) && !file.extractionError) {
                images.push({ name: file.fileHeader.name, url: URL.createObjectURL(new Blob([file.extract])) });
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
        setError('Failed to load: ' + err.message);
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
        'background-color': `${ct.bg} !important`,
        'background-image': 'none !important',
        'color': `${ct.text} !important`,
        'font-family': 'system-ui, -apple-system, sans-serif !important',
        'padding': '0 40px !important',
      },
      p: { 'line-height': '1.6 !important', 'margin-bottom': '1em !important' }
    });
    rendition.themes.fontSize(`${fontSize}%`);
  };

  useEffect(() => {
    if (renditionRef.current) applyEpubTheme(renditionRef.current);
  }, [settings.theme, fontSize]);

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
            }
          } catch {}
        });

        if (currentCfi) await rendition.display(currentCfi);
        else await rendition.display();
      }
    };
    updateEpubFlow();
  }, [scrollMode]);

  const renderPdfPage = async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    // Claim a token; if a newer call arrives before this one finishes, abort.
    const token = ++renderTokenRef.current;
    const page = await pdfDocRef.current.getPage(pageNumber);
    if (token !== renderTokenRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const vp = page.getViewport({ scale: 1.5 * zoom });
    canvas.height = vp.height; canvas.width = vp.width;
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  };

  useEffect(() => {
    if (book.type === BookType.PDF && !scrollMode) renderPdfPage(currentPage);
    onProgressUpdate(book.id, currentPage, totalPages);
  }, [currentPage, zoom, totalPages]);

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
        const vp = page.getViewport({ scale: 1.2 * zoom });
        cv.width = vp.width; cv.height = vp.height;
        await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp, canvas: cv }).promise;
        urls.push(cv.toDataURL('image/jpeg', 0.85));
        setScrollPages([...urls]);
        // Yield to the main thread to allow UI to update and not block scrolling
        await new Promise(r => setTimeout(r, 10));
      }
      setScrollPages(urls);
      setRenderingScroll(false);
    };
    renderAll();
  }, [scrollMode, zoom]);

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

  // ── Touch/swipe handlers ──────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goToNext();
      else goToPrev();
    }
  };

  // ── Bookmarks ─────────────────────────────────────────────────────────
  const addBookmark = async () => {
    const bm: Bookmark = {
      id: crypto.randomUUID(),
      bookId: book.id,
      page: currentPage,
      cfi: book.type === BookType.EPUB ? (renditionRef.current as any)?.location?.start?.cfi : undefined,
      label: `Page ${currentPage}`,
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

  const jumpToBookmark = (bm: Bookmark) => {
    if (book.type === BookType.EPUB && renditionRef.current && bm.cfi) {
      renditionRef.current.display(bm.cfi);
    } else {
      setCurrentPage(bm.page);
    }
    setShowBookmarks(false);
  };

  // ── Share ─────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `I'm reading "${book.title}" by ${book.author} — ${book.progress}% complete`,
        });
      } catch { /* user cancelled */ }
    }
  };

  const isBookmarkedOnCurrentPage = bookmarks.some((b) => b.page === currentPage);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center transition-all duration-300"
      style={{ backgroundColor: ct.bg, filter: `brightness(${brightness}%)`, color: ct.text }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Click interaction zones (non-EPUB) */}
      {!loading && !error && book.type !== BookType.EPUB && (
        <div className="absolute inset-0 z-10 flex">
          <div className="flex-1 cursor-w-resize" onClick={goToPrev} />
          <div className="w-1/3 cursor-pointer" onClick={() => setShowControls((p) => !p)} />
          <div className="flex-1 cursor-e-resize" onClick={goToNext} />
        </div>
      )}

      {/* Content Area */}
      <div className="relative w-full h-full flex items-center justify-center overflow-auto transition-colors duration-300"
        style={{ backgroundColor: book.type === BookType.EPUB ? ct.bg : 'transparent' }}>

        {loading && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
            </div>
            <p className="text-lg font-bold">Loading...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md p-10 rounded-[2.5rem] text-center border" style={{ backgroundColor: ct.glass, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">error</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Could not open book</h3>
            <p className="opacity-50 text-sm mb-8 leading-relaxed">{error}</p>
            <button onClick={onClose} className="w-full py-4 rounded-2xl font-bold border" style={{ backgroundColor: ct.glass, borderColor: ct.border }}>
              Back to Library
            </button>
          </div>
        )}

        {/* EPUB viewer */}
        {book.type === BookType.EPUB && (
          <div className="relative w-full h-full max-w-4xl mx-auto">
            <div
              ref={epubViewerRef}
              className={`w-full h-full shadow-2xl transition-opacity duration-500 ${
                loading ? 'opacity-0' : 'opacity-100'
              } ${!loading && isPageTurning
                  ? (turnDirection === 'next' ? 'epub-next-exit' : 'epub-prev-exit')
                  : (!loading && isEntering
                      ? (turnDirection === 'next' ? 'epub-next-enter' : 'epub-prev-enter')
                      : '')
              }`}
            />
            {!loading && (
              <div className="absolute inset-0 z-20 flex pointer-events-none">
                <div className="flex-1 cursor-w-resize pointer-events-auto" onClick={goToPrev} />
                <div className="w-1/3 cursor-pointer pointer-events-auto" onClick={() => setShowControls((p) => !p)} />
                <div className="flex-1 cursor-e-resize pointer-events-auto" onClick={goToNext} />
              </div>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* PDF — scroll mode */}
            {book.type === BookType.PDF && scrollMode && (
              <div className="w-full h-full overflow-y-auto py-6 px-4 space-y-4">
                {renderingScroll && scrollPages.length === 0 && (
                  <div className="flex justify-center py-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                {scrollPages.map((src, i) => (
                  <img key={i} src={src} className="w-full shadow-lg rounded-lg bg-white" alt={`Page ${i + 1}`} />
                ))}
                {pdfDocRef.current && pdfDocRef.current.numPages > 30 && (
                  <p className="text-center text-xs opacity-30 py-4">Scroll mode shows the first 30 pages.</p>
                )}
              </div>
            )}

            {/* PDF — paginated mode */}
            {book.type === BookType.PDF && !scrollMode && (
              <div className="page-flip flex items-center justify-center w-full h-full">
                <div
                  className={`p-8 pb-32 pt-20 ${
                    isPageTurning
                      ? (turnDirection === 'next' ? 'page-flip-next-exit' : 'page-flip-prev-exit')
                      : (isEntering ? (turnDirection === 'next' ? 'page-flip-next-enter' : 'page-flip-prev-enter') : '')
                  }`}
                >
                  <canvas ref={canvasRef} className="max-w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-lg bg-white" />
                </div>
              </div>
            )}

            {/* CBR/CBZ — single page */}
            {book.type === BookType.CBR && !doublePage && comicImages[currentPage - 1] && (
              <div className="relative h-full w-full flex items-center justify-center p-4 lg:p-10 page-flip">
                <img
                  key={currentPage}
                  src={comicImages[currentPage - 1]}
                  className={`max-h-full max-w-full object-contain shadow-[0_20px_80px_rgba(0,0,0,0.6)] rounded-sm ${
                    isPageTurning
                      ? (turnDirection === 'next' ? 'page-flip-next-exit' : 'page-flip-prev-exit')
                      : (isEntering ? (turnDirection === 'next' ? 'page-flip-next-enter' : 'page-flip-prev-enter') : '')
                  }`}
                  alt={`Page ${currentPage}`}
                />
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
              </div>
            )}

            {/* CBR/CBZ — double page */}
            {book.type === BookType.CBR && doublePage && (
              <div className="relative h-full w-full flex items-center justify-center gap-1 p-2 lg:p-6">
                {comicImages[currentPage - 1] && (
                  <img src={comicImages[currentPage - 1]} className="max-h-full max-w-[49%] object-contain shadow-xl rounded-sm" alt={`Page ${currentPage}`} />
                )}
                {comicImages[currentPage] && (
                  <img src={comicImages[currentPage]} className="max-h-full max-w-[49%] object-contain shadow-xl rounded-sm" alt={`Page ${currentPage + 1}`} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 inset-x-0 z-[120] px-4 sm:px-6 py-3 sm:py-4 transition-all duration-500 ease-out transform border-b ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ backgroundColor: ct.bg, borderColor: ct.border, backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 border" style={{ backgroundColor: ct.glass, borderColor: ct.border }}>
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
                ? { backgroundColor: '#2563eb22', borderColor: '#2563eb66', color: '#2563eb' }
                : { backgroundColor: ct.glass, borderColor: ct.border }
              }
            >
              <span className="material-symbols-outlined text-xl" style={isBookmarkedOnCurrentPage ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
            </button>

            {/* Bookmarks panel */}
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${showBookmarks ? 'bg-primary border-primary text-white' : ''}`}
              style={!showBookmarks ? { backgroundColor: ct.glass, borderColor: ct.border } : {}}
            >
              <span className="material-symbols-outlined text-xl">bookmarks</span>
            </button>

            {/* Share */}
            {navigator.share && (
              <button onClick={handleShare} className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border" style={{ backgroundColor: ct.glass, borderColor: ct.border }}>
                <span className="material-symbols-outlined text-xl">share</span>
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${showSettings ? 'bg-primary border-primary text-white' : ''}`}
              style={!showSettings ? { backgroundColor: ct.glass, borderColor: ct.border } : {}}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
          </div>
        </div>

        {/* Bookmarks Panel */}
        <div
          className={`absolute top-full right-4 sm:right-6 mt-4 w-72 rounded-3xl p-5 space-y-4 shadow-2xl transition-all duration-500 transform border z-[130] ${showBookmarks && showControls ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}
          style={{ backgroundColor: settings.theme === 'white' ? '#f8fafc' : '#1a1d2e', borderColor: ct.border }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Bookmarks</p>
            <span className="text-[10px] font-bold text-primary">{bookmarks.length}</span>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-4">No bookmarks yet. Tap the bookmark icon to add one.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bookmarks.sort((a, b) => a.page - b.page).map((bm) => (
                <div key={bm.id} className="flex items-center gap-3 group">
                  <button onClick={() => jumpToBookmark(bm)} className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
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
          style={{ backgroundColor: settings.theme === 'white' ? '#f8fafc' : '#1a1d2e', borderColor: ct.border }}
        >
          {/* Brightness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Brightness</span>
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
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Zoom</span>
                <span className="text-xs font-bold text-primary">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg opacity-20">zoom_out</span>
                <input type="range" min="0.8" max="2.5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
                <span className="material-symbols-outlined text-lg opacity-20">zoom_in</span>
              </div>
            </div>
          )}

          {/* Font size (EPUB) */}
          {book.type === BookType.EPUB && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Font Size</span>
                <span className="text-xs font-bold text-primary">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold opacity-20">A</span>
                <input type="range" min="60" max="200" step="10" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
                <span className="text-xl font-bold opacity-20">A</span>
              </div>
            </div>
          )}

          {/* Scroll mode (PDF / EPUB) */}
          {(book.type === BookType.PDF || book.type === BookType.EPUB) && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Scroll Mode</p>
                <p className="text-[9px] opacity-20 mt-0.5">Continuous vertical flow</p>
              </div>
              <button
                onClick={() => setScrollMode((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors ${scrollMode ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-all ${scrollMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}

          {/* Double page (CBR only) */}
          {book.type === BookType.CBR && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Double Page</p>
                <p className="text-[9px] opacity-20 mt-0.5">Side-by-side spreads</p>
              </div>
              <button
                onClick={() => setDoublePage((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors ${doublePage ? 'bg-primary' : 'bg-white/10'}`}
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
          style={{ backgroundColor: ct.bg, borderColor: ct.border, backdropFilter: 'blur(16px)' }}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex justify-between items-center px-2">
              <button onClick={goToPrev} disabled={currentPage === 1} className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100 disabled:opacity-20">
                <span className="material-symbols-outlined text-base">chevron_left</span> Prev
              </button>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border shadow-lg" style={{ backgroundColor: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.3)', color: '#2563eb' }}>
                  {currentPage} <span className="opacity-40 mx-1">/</span> {totalPages}
                </span>
                {totalPages > 0 && <span className="text-[8px] opacity-30 font-bold uppercase tracking-widest">{Math.round((currentPage / totalPages) * 100)}%</span>}
              </div>
              <button onClick={goToNext} disabled={currentPage >= totalPages} className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100 disabled:opacity-20">
                Next <span className="material-symbols-outlined text-base">chevron_right</span>
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

      {/* Mini progress indicator when controls are hidden */}
      {!showControls && !loading && !error && (
        <div className="fixed bottom-10 right-8 z-[110] animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="px-4 py-2 flex items-center gap-3 border shadow-2xl rounded-full" style={{ backgroundColor: ct.glass, borderColor: ct.border, backdropFilter: 'blur(12px)' }}>
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold opacity-60 tracking-[0.2em]">{currentPage} / {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
