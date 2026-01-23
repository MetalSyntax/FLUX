
import React, { useState, useEffect } from 'react';
import { Book, BookType } from '../types';
import * as db from '../db';

interface LibraryProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  onDelete: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({ 
  books, onOpenBook, searchQuery, setSearchQuery, activeFilter, setActiveFilter, onDelete
}) => {
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'date'>('date');
  const [showSort, setShowSort] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    db.getMetadata('sort_pref').then(pref => pref && setSortBy(pref));
    db.getMetadata('search_history').then(h => h && setHistory(h));
  }, []);

  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 5);
    setHistory(newHistory);
    db.saveMetadata('search_history', newHistory);
    setShowHistory(false);
  };

  const sortedBooks = [...books]
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || 
                           (activeFilter === 'Manga' && book.type === BookType.CBR) ||
                           (activeFilter === 'PDFs' && book.type === BookType.PDF) ||
                           (activeFilter === 'EPUBs' && book.type === BookType.EPUB);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      return b.lastReadDate - a.lastReadDate;
    });

  const categories = ['All', 'Manga', 'EPUBs', 'PDFs'];

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Bar with History */}
      <div className="relative group z-30">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined opacity-40">search</span>
        <input 
          type="text" 
          placeholder="Search documents..."
          value={searchQuery}
          onFocus={() => setShowHistory(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 glass rounded-3xl pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:opacity-30 transition-all"
        />
        {showHistory && history.length > 0 && !searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl p-2 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest px-3 py-2">Recent Searches</p>
            {history.map(h => (
              <button 
                key={h}
                onClick={() => { setSearchQuery(h); setShowHistory(false); }}
                className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-white/5 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-sm opacity-30">history</span> {h}
              </button>
            ))}
            <button 
              onClick={() => { setHistory([]); db.saveMetadata('search_history', []); }}
              className="w-full text-center py-2 text-[10px] font-bold text-red-500/60 uppercase hover:text-red-500"
            >
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Filter and Sort Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-1">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border shrink-0 ${
                activeFilter === cat 
                ? 'bg-primary border-primary text-white shadow-lg' 
                : 'glass text-current opacity-60 hover:opacity-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowSort(!showSort)}
            className="size-9 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
          </button>
          {showSort && (
            <div className="absolute top-full right-0 mt-2 w-40 glass rounded-2xl p-2 border border-white/10 shadow-2xl z-40 animate-in fade-in zoom-in-95">
              {(['title', 'author', 'date'] as const).map(opt => (
                <button 
                  key={opt}
                  onClick={() => { 
                    setSortBy(opt); 
                    setShowSort(false); 
                    db.saveMetadata('sort_pref', opt);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all capitalize ${
                    sortBy === opt ? 'bg-primary text-white' : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  By {opt === 'date' ? 'Last Read' : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid List */}
      <section className="pb-10">
        <div className="flex items-center justify-between mb-5">
           <h2 className="text-xl font-bold tracking-tight">Library</h2>
           <span className="text-[10px] font-bold opacity-30 uppercase">{sortedBooks.length} Items</span>
        </div>
        
        {sortedBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {sortedBooks.map(book => (
              <div 
                key={book.id} 
                className="relative glass rounded-2xl p-3 border border-white/5 hover:border-primary/30 transition-all group active:scale-95"
              >
                <div onClick={() => onOpenBook(book)} className="cursor-pointer">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-slate-800">
                    <img src={book.coverUrl} alt="" className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-[8px] font-bold uppercase tracking-tighter text-white">
                      {book.type}
                    </div>
                    {/* Progress Bar Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div className="h-full bg-primary" style={{ width: `${book.progress}%` }}></div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] opacity-40 uppercase tracking-widest">{book.author}</p>
                    <p className="text-[9px] font-bold text-primary">{book.progress}%</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                  className="absolute top-1 right-1 size-6 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4 font-light">library_books</span>
            <p className="text-sm font-medium">No documents found matching filters.</p>
          </div>
        )}
      </section>
      
      {showHistory && (
        <div className="fixed inset-0 z-20" onClick={() => setShowHistory(false)}></div>
      )}
    </div>
  );
};

export default Library;
