
import React, { useState, useEffect, useRef } from 'react';
import { Book, BookType, UserSettings } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import ePub, { Rendition } from 'epubjs';
import JSZip from 'jszip';
// @ts-ignore
import { createExtractorFromData } from 'unrar-js';
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ReaderViewProps {
  book: Book;
  settings: UserSettings;
  onClose: () => void;
  onProgressUpdate: (bookId: string, page: number, total?: number, cover?: string) => void;
}

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

  // PDF Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // EPUB Refs
  const epubViewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<any>(null);

  // CBR/CBZ Refs
  const [comicImages, setComicImages] = useState<string[]>([]);

  // Theme Colors mapping
  const themeColors = {
    dark: { bg: '#0b0e1a', text: '#ffffff', glass: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' },
    black: { bg: '#000000', text: '#ffffff', glass: 'rgba(255, 255, 255, 0.03)', border: 'rgba(255, 255, 255, 0.08)' },
    white: { bg: '#ffffff', text: '#0f172a', glass: 'rgba(15, 23, 42, 0.05)', border: 'rgba(15, 23, 42, 0.1)' }
  };

  const currentTheme = themeColors[settings.theme] || themeColors.dark;

  useEffect(() => {
    const loadBook = async () => {
      if (!book.file) {
        setError("No file found for this book");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await book.file.arrayBuffer();

        if (book.type === BookType.PDF) {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          
          try {
            const firstPage = await pdf.getPage(1);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = firstPage.getViewport({ scale: 0.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await firstPage.render({ canvasContext: context!, viewport, canvas }).promise;
            const coverDataUrl = canvas.toDataURL();
            onProgressUpdate(book.id, currentPage, pdf.numPages, coverDataUrl);
          } catch (e) {
            console.error("PDF Cover Error:", e);
          }

          await renderPdfPage(currentPage);
          setLoading(false);
        } 
        else if (book.type === BookType.EPUB) {
          const epub = ePub(arrayBuffer);
          bookRef.current = epub;
          
          epub.coverUrl().then(async url => {
             if (url) {
               try {
                 const blob = await fetch(url).then(r => r.blob());
                 const reader = new FileReader();
                 reader.onloadend = () => {
                   onProgressUpdate(book.id, currentPage, totalPages, reader.result as string);
                 };
                 reader.readAsDataURL(blob);
               } catch (e) {
                 console.error("EPUB Cover Persistence Error:", e);
               }
             }
          });

          setTimeout(async () => {
            if (epubViewerRef.current) {
              const rendition = epub.renderTo(epubViewerRef.current, {
                width: '100%',
                height: '100%',
                flow: 'paginated',
                manager: 'default',
                allowScriptedContent: true
              });
              renditionRef.current = rendition;
              
              applyEpubTheme(rendition);

              await rendition.display();
              
              rendition.on('click', (e: any) => {
                const width = window.innerWidth;
                const x = e.clientX;
                if (x < width * 0.3) {
                  goToPrev();
                } else if (x > width * 0.7) {
                  goToNext();
                } else {
                  setShowControls(prev => !prev);
                }
              });

              epub.locations.generate(1000).then(() => {
                setTotalPages(epub.locations.length());
              });

              rendition.on('relocated', (location: any) => {
                const percent = epub.locations.percentageFromCfi(location.start.cfi);
                const page = Math.floor(percent * epub.locations.length()) + 1;
                setCurrentPage(page);
              });

              setLoading(false);
            }
          }, 100);
        }
        else if (book.type === BookType.CBR) {
          const fileName = book.file.name.toLowerCase();
          const images: { name: string; url: string }[] = [];

          if (fileName.endsWith('.cbz') || !fileName.endsWith('.cbr')) { 
            const zip = await JSZip.loadAsync(arrayBuffer);
            const filePromises: Promise<void>[] = [];
            zip.forEach((relativePath, file) => {
              if (relativePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                filePromises.push((async () => {
                  const blob = await file.async('blob');
                  images.push({ name: relativePath, url: URL.createObjectURL(blob) });
                })());
              }
            });
            await Promise.all(filePromises);
          } else {
            const extractor = await createExtractorFromData({ data: arrayBuffer });
            const extracted = extractor.extractAll();
            for (const file of extracted.files) {
              if (file.fileHeader.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) && !file.extractionError) {
                const blob = new Blob([file.extract]);
                images.push({ name: file.fileHeader.name, url: URL.createObjectURL(blob) });
              }
            }
          }

          images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
          const imageUrls = images.map(img => img.url);
          setComicImages(imageUrls);
          setTotalPages(imageUrls.length);
          
          if (imageUrls.length > 0) {
            // Persist the first image as cover
            try {
              const coverBlob = await fetch(imageUrls[0]).then(r => r.blob());
              const reader = new FileReader();
              reader.onloadend = () => {
                onProgressUpdate(book.id, currentPage, imageUrls.length, reader.result as string);
              };
              reader.readAsDataURL(coverBlob);
            } catch (e) {
              console.error("CBR Cover Persistence Error:", e);
            }
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error loading book:", err);
        setError("Failed to load book: " + err.message);
        setLoading(false);
      }
    };

    loadBook();

    return () => {
      if (bookRef.current) bookRef.current.destroy();
      comicImages.forEach(src => URL.revokeObjectURL(src));
    };
  }, [book]);

  const applyEpubTheme = (rendition: Rendition) => {
    if (!rendition) return;
    
    rendition.themes.default({
      'body': {
        'background-color': `${currentTheme.bg} !important`,
        'color': `${currentTheme.text} !important`,
        'font-family': 'system-ui, -apple-system, sans-serif !important',
        'padding': '0 40px !important'
      },
      'p': {
        'line-height': '1.6 !important',
        'margin-bottom': '1em !important'
      }
    });
    rendition.themes.fontSize(`${fontSize}%`);
  };

  useEffect(() => {
    if (renditionRef.current) {
      applyEpubTheme(renditionRef.current);
    }
  }, [settings.theme, fontSize]);

  const renderPdfPage = async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      const viewport = page.getViewport({ scale: 1.5 * zoom }); 
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = { canvasContext: context, viewport: viewport, canvas };
      await page.render(renderContext).promise;
    } catch (err) {
      console.error("Error rendering PDF page:", err);
    }
  };

  useEffect(() => {
    if (book.type === BookType.PDF) {
      renderPdfPage(currentPage);
    }
    onProgressUpdate(book.id, currentPage, totalPages);
  }, [currentPage, zoom, totalPages]);

  const goToNext = () => {
    if (currentPage < totalPages && !isPageTurning) {
      setTurnDirection('next');
      setIsPageTurning(true);
      
      setTimeout(() => {
        if (book.type === BookType.EPUB && renditionRef.current) {
          renditionRef.current.next();
        } else {
          setCurrentPage(prev => prev + 1);
        }
        setIsPageTurning(false);
        setIsEntering(true);
        setTimeout(() => setIsEntering(false), 700);
      }, 700);
    }
  };

  const goToPrev = () => {
    if (currentPage > 1 && !isPageTurning) {
      setTurnDirection('prev');
      setIsPageTurning(true);
      
      setTimeout(() => {
        if (book.type === BookType.EPUB && renditionRef.current) {
          renditionRef.current.prev();
        } else {
          setCurrentPage(prev => prev - 1);
        }
        setIsPageTurning(false);
        setIsEntering(true);
        setTimeout(() => setIsEntering(false), 700);
      }, 700);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center transition-all duration-300"
      style={{ 
        backgroundColor: currentTheme.bg,
        filter: `brightness(${brightness}%)`,
        color: currentTheme.text
      }}
    >
      {/* Interaction Layers */}
      {!loading && !error && (
        <div className="absolute inset-0 z-10 flex">
          <div className="flex-1 cursor-w-resize" onClick={goToPrev}></div>
          <div className="w-1/3 cursor-pointer" onClick={() => setShowControls(prev => !prev)}></div>
          <div className="flex-1 cursor-e-resize" onClick={goToNext}></div>
        </div>
      )}

      {/* Content Area */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-auto transition-colors duration-300"
        style={{ backgroundColor: book.type === BookType.EPUB ? currentTheme.bg : 'transparent' }}
      >
        {loading && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold tracking-tight">Cargando lectura...</p>
              <p className="opacity-40 text-xs uppercase tracking-widest font-medium">Preparando experiencia Glass</p>
            </div>
          </div>
        )}

        {error && (
          <div 
            className="max-w-md p-10 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-500 border"
            style={{ backgroundColor: currentTheme.glass, borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">error</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Error de lectura</h3>
            <p className="opacity-50 text-sm mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={onClose} 
              className="w-full py-4 rounded-2xl font-bold transition-all border shrink-0"
              style={{ backgroundColor: currentTheme.glass, borderColor: currentTheme.border }}
            >
              Volver a la biblioteca
            </button>
          </div>
        )}

        {book.type === BookType.EPUB && (
          <div className="relative w-full h-full max-w-4xl mx-auto">
            <div ref={epubViewerRef} className={`w-full h-full shadow-2xl ${loading ? 'opacity-0' : 'opacity-100'} transition-all duration-700`} />
            {!loading && (
              <div className="absolute inset-0 z-20 flex pointer-events-none">
                <div className="flex-1 cursor-w-resize pointer-events-auto" onClick={goToPrev}></div>
                <div className="w-1/3 cursor-pointer pointer-events-auto" onClick={() => setShowControls(prev => !prev)}></div>
                <div className="flex-1 cursor-e-resize pointer-events-auto" onClick={goToNext}></div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            {book.type === BookType.PDF && (
              <div className="p-8 pb-32 pt-20">
                <canvas ref={canvasRef} className="max-w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-lg bg-white" />
              </div>
            )}

            {book.type === BookType.CBR && comicImages[currentPage - 1] && (
              <div className="relative h-full w-full flex items-center justify-center p-4 lg:p-10 page-flip">
                <img 
                  key={currentPage}
                  src={comicImages[currentPage - 1]} 
                  className={`max-h-full max-w-full object-contain shadow-[0_20px_80px_rgba(0,0,0,0.6)] rounded-sm ${
                    isPageTurning 
                      ? (turnDirection === 'next' ? 'page-flip-next-exit' : 'page-flip-prev-exit') 
                      : (isEntering ? (turnDirection === 'next' ? 'page-flip-next-enter' : 'page-flip-prev-enter') : '')
                  }`} 
                  alt={`Página ${currentPage}`}
                />
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top Bar */}
      <div 
        className={`fixed top-0 inset-x-0 z-[120] px-4 sm:px-6 py-3 sm:py-4 transition-all duration-500 ease-out transform border-b ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <button 
              onClick={onClose} 
              className="size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 border"
              style={{ backgroundColor: currentTheme.glass, borderColor: currentTheme.border }}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold truncate">{book.title}</h2>
              <p className="text-[10px] opacity-40 uppercase tracking-[0.1em] sm:tracking-[0.2em] font-medium truncate">{book.author}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${showSettings ? 'bg-primary border-primary text-white' : ''}`}
              style={!showSettings ? { backgroundColor: currentTheme.glass, borderColor: currentTheme.border } : {}}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">settings</span>
            </button>
          </div>
        </div>

        {/* Floating Settings Menu - Fixed Transparency */}
        <div 
          className={`absolute top-full right-4 sm:right-6 mt-4 w-72 rounded-3xl p-6 space-y-8 shadow-2xl transition-all duration-500 transform border z-[130] ${showSettings && showControls ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}
          style={{ backgroundColor: settings.theme === 'white' ? '#f8fafc' : '#1a1d2e', borderColor: currentTheme.border }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Brillo</span>
              <span className="text-xs font-bold text-primary">{brightness}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-lg opacity-20">light_mode</span>
              <input 
                type="range" min="30" max="100" value={brightness} 
                onChange={(e) => setBrightness(parseInt(e.target.value))} 
                className="flex-1 accent-primary cursor-pointer" 
              />
              <span className="material-symbols-outlined text-lg opacity-20">brightness_high</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Zoom</span>
              <span className="text-xs font-bold text-primary">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-lg opacity-20">zoom_out</span>
              <input 
                type="range" min="0.8" max="2.5" step="0.1" value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))} 
                className="flex-1 accent-primary cursor-pointer" 
              />
              <span className="material-symbols-outlined text-lg opacity-20">zoom_in</span>
            </div>
          </div>

          {book.type === BookType.EPUB && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Tamaño Texto</span>
                <span className="text-xs font-bold text-primary">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold opacity-20">A</span>
                <input 
                  type="range" min="60" max="200" step="10" value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))} 
                  className="flex-1 accent-primary cursor-pointer" 
                />
                <span className="text-xl font-bold opacity-20">A</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      {!loading && !error && (
        <div 
          className={`fixed bottom-0 inset-x-0 z-[110] px-4 sm:px-6 py-6 sm:py-8 pb-10 sm:pb-12 transition-all duration-500 ease-out transform border-t ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
          style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, backdropFilter: 'blur(16px)' }}
        >
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center px-2">
              <button 
                onClick={goToPrev} 
                className="flex items-center gap-1 sm:gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100"
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined text-base sm:text-lg">chevron_left</span> Ant
              </button>
              
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span 
                  className="text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border shadow-lg"
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)', color: '#2563eb' }}
                >
                  {currentPage} <span className="opacity-40 font-medium mx-1">/</span> {totalPages}
                </span>
                {totalPages > 0 && (
                  <span className="text-[8px] sm:text-[9px] opacity-30 font-bold uppercase tracking-widest">
                    {Math.round((currentPage/totalPages)*100)}%
                  </span>
                )}
              </div>

              <button 
                onClick={goToNext} 
                className="flex items-center gap-1 sm:gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors hover:opacity-100"
                disabled={currentPage === totalPages}
              >
                Sig <span className="material-symbols-outlined text-base sm:text-lg">chevron_right</span>
              </button>
            </div>

            <div className="relative group px-2">
              <input 
                type="range" 
                min="1" 
                max={totalPages || 1} 
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (book.type === BookType.EPUB && renditionRef.current && bookRef.current) {
                    const cfi = bookRef.current.locations.cfiFromPercentage((val - 1) / totalPages);
                    renditionRef.current.display(cfi);
                  } else {
                    setCurrentPage(val);
                  }
                }} 
                className="relative w-full h-1.5 bg-current opacity-20 rounded-full appearance-none accent-primary cursor-pointer hover:h-2 transition-all" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Mini Progress Indicator */}
      {!showControls && !loading && !error && (
        <div className="fixed bottom-10 right-8 z-[110] animate-in fade-in slide-in-from-right-4 duration-500">
          <div 
            className="px-4 py-2 flex items-center gap-3 border shadow-2xl rounded-full"
            style={{ backgroundColor: currentTheme.glass, borderColor: currentTheme.border, backdropFilter: 'blur(12px)' }}
          >
            <div className="size-1.5 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-bold opacity-60 tracking-[0.2em]">{currentPage} / {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
