
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, BookType } from '../types';

interface ReaderViewProps {
  book: Book;
  onClose: () => void;
  onProgressUpdate: (bookId: string, page: number) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({ book, onClose, onProgressUpdate }) => {
  const [currentPage, setCurrentPage] = useState(book.currentPage || 1);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [isCbr, setIsCbr] = useState(book.type === BookType.CBR);

  // Simulation for Comic Image Extraction
  // In a real implementation, you'd use JSZip here for CBR/CBZ
  const pageSrc = useMemo(() => {
    if (book.type === BookType.PDF && book.file) {
      return URL.createObjectURL(book.file);
    }
    // For CBR, we simulate fetching the specific image frame
    return `https://picsum.photos/seed/${book.id}-${currentPage}/800/1200`;
  }, [book.id, book.file, book.type, currentPage]);

  useEffect(() => {
    onProgressUpdate(book.id, currentPage);
  }, [currentPage]);

  const goToNext = () => {
    if (currentPage < book.totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center transition-all duration-300"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Interaction Layers */}
      <div className="absolute inset-0 z-10 flex">
        <div className="flex-1 cursor-w-resize" onClick={goToPrev}></div>
        <div className="w-1/3 cursor-pointer" onClick={() => setShowControls(!showControls)}></div>
        <div className="flex-1 cursor-e-resize" onClick={goToNext}></div>
      </div>

      {/* Main Content Render */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-auto"
        style={{ transform: `scale(${zoom})` }}
      >
        {book.type === BookType.PDF && pageSrc ? (
          <iframe 
            src={`${pageSrc}#page=${currentPage}`} 
            className="w-full h-full border-none bg-white" 
            title="Reader" 
          />
        ) : (
          <div className="relative h-full w-full flex items-center justify-center p-4">
             <img 
               key={currentPage}
               src={pageSrc} 
               className="max-h-full max-w-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300" 
               alt={`Page ${currentPage}`}
             />
             {/* Subtle Page Edge Gradient for Comic feel */}
             <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
             <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
          </div>
        )}
      </div>

      {/* Top Bar Controls */}
      <div className={`fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/5 p-4 transition-transform duration-500 ease-out ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-bold truncate max-w-[200px]">{book.title}</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">{book.author}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
               <span className="material-symbols-outlined text-lg opacity-40">zoom_in</span>
               <input 
                 type="range" min="0.8" max="2.5" step="0.1" value={zoom} 
                 onChange={(e) => setZoom(parseFloat(e.target.value))} 
                 className="w-20 accent-primary" 
               />
             </div>
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
               <span className="material-symbols-outlined text-lg opacity-40">brightness_medium</span>
               <input 
                 type="range" min="30" max="100" value={brightness} 
                 onChange={(e) => setBrightness(parseInt(e.target.value))} 
                 className="w-20 accent-primary" 
               />
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Progress Controls */}
      <div className={`fixed bottom-0 inset-x-0 z-50 glass-dark border-t border-white/5 p-6 pb-10 transition-transform duration-500 ease-out ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">
            <button onClick={goToPrev} className="flex items-center gap-1 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">navigate_before</span> Previous
            </button>
            <div className="flex items-center gap-2 text-white">
               <span className="bg-primary/20 px-2 py-0.5 rounded text-primary">Page {currentPage}</span> 
               <span>of {book.totalPages}</span>
               <span className="opacity-30">({Math.round((currentPage/book.totalPages)*100)}%)</span>
            </div>
            <button onClick={goToNext} className="flex items-center gap-1 hover:text-primary transition-colors">
              Next <span className="material-symbols-outlined text-sm">navigate_next</span>
            </button>
          </div>
          <div className="relative h-6 flex items-center group">
            <input 
              type="range" 
              min="1" 
              max={book.totalPages} 
              value={currentPage} 
              onChange={(e) => setCurrentPage(parseInt(e.target.value))} 
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer" 
            />
          </div>
        </div>
      </div>

      {/* Simple Page Floating Indicator when controls hidden */}
      {!showControls && (
        <div className="fixed bottom-10 right-6 z-50 px-3 py-1.5 glass rounded-full opacity-40 pointer-events-none animate-in fade-in duration-500">
           <span className="text-[10px] font-bold tracking-widest">{currentPage} / {book.totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
