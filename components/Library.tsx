
import React, { useState, useEffect, useRef } from 'react';
import { Book, BookType, Collection, UserSettings } from '../types';
import * as db from '../db';

interface LibraryProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  settings: UserSettings;
}

const COLL_COLORS = ['var(--color-primary)', 'var(--color-purple)', 'var(--color-red)', 'var(--color-green)', 'var(--color-orange)', 'var(--color-cyan)'];

const THEME_COLORS = {
  dark:  { bg: 'var(--ui-bg-elevated)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)', placeholder: 'rgba(255,255,255,0.28)', icon: 'rgba(255,255,255,0.35)' },
  black: { bg: 'var(--ui-bg-elevated)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)', placeholder: 'rgba(255,255,255,0.25)', icon: 'rgba(255,255,255,0.30)' },
  white: { bg: 'var(--ui-bg-elevated)', text: 'var(--text-main)', glass: 'var(--glass-bg)', border: 'var(--ui-border)', placeholder: 'rgba(15,23,42,0.30)',   icon: 'rgba(15,23,42,0.35)'  },
};

const Library: React.FC<LibraryProps> = ({
  books, onOpenBook, searchQuery, setSearchQuery,
  activeFilter, setActiveFilter, onDelete, onFavorite, settings
}) => {
  const ct = THEME_COLORS[settings.theme] ?? THEME_COLORS.dark;
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'date'>('date');
  const [showSort, setShowSort] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isGrid, setIsGrid] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [showNewColl, setShowNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollColor, setNewCollColor] = useState(COLL_COLORS[0]);
  const [bookMenu, setBookMenu] = useState<string | null>(null);
  const [addToCollMenu, setAddToCollMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getMetadata('sort_pref').then((p) => p && setSortBy(p));
    db.getMetadata('search_history').then((h) => h && setHistory(h));
    db.getMetadata('lib_view').then((v) => v !== undefined && setIsGrid(v));
    db.getCollections().then(setCollections);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setBookMenu(null);
        setAddToCollMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter((h) => h !== q)].slice(0, 5);
    setHistory(newHistory);
    db.saveMetadata('search_history', newHistory);
    setShowHistory(false);
  };

  const toggleView = () => {
    const next = !isGrid;
    setIsGrid(next);
    db.saveMetadata('lib_view', next);
  };

  const createCollection = async () => {
    if (!newCollName.trim()) return;
    const col: Collection = {
      id: crypto.randomUUID(),
      name: newCollName.trim(),
      color: newCollColor,
      bookIds: [],
    };
    await db.saveCollection(col);
    setCollections((prev) => [...prev, col]);
    setNewCollName('');
    setShowNewColl(false);
  };

  const removeCollection = async (id: string) => {
    await db.deleteCollection(id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (activeCollection === id) setActiveCollection(null);
  };

  const addBookToCollection = async (bookId: string, collId: string) => {
    const col = collections.find((c) => c.id === collId);
    if (!col || col.bookIds.includes(bookId)) return;
    const updated = { ...col, bookIds: [...col.bookIds, bookId] };
    await db.saveCollection(updated);
    setCollections((prev) => prev.map((c) => (c.id === collId ? updated : c)));
    setBookMenu(null);
    setAddToCollMenu(null);
  };

  const categories = ['All', 'Favorites', 'Manga', 'EPUBs', 'PDFs'];

  const filteredBooks = [...books]
    .filter((book) => {
      if (activeCollection) return collections.find((c) => c.id === activeCollection)?.bookIds.includes(book.id);
      const matchSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Favorites' && book.isFavorite) ||
        (activeFilter === 'Manga' && book.type === BookType.CBR) ||
        (activeFilter === 'PDFs' && book.type === BookType.PDF) ||
        (activeFilter === 'EPUBs' && book.type === BookType.EPUB);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      return b.lastReadDate - a.lastReadDate;
    });

  return (
    <div className="px-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search */}
      <div className="relative z-30">
        {/* Search icon */}
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl pointer-events-none select-none"
          style={{ color: ct.icon }}
        >
          search
        </span>

        <input
          type="text"
          placeholder="Search library..."
          value={searchQuery}
          onFocus={() => setShowHistory(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 rounded-3xl pl-12 pr-12 text-sm outline-none transition-all appearance-none"
          style={{
            backgroundColor: ct.glass,
            border: `1px solid ${searchQuery ? 'rgba(0,192,139,0.45)' : ct.border}`,
            color: ct.text,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: searchQuery ? '0 0 0 3px rgba(0,192,139,0.12)' : 'none',
          }}
        />

        {/* Placeholder shimmed via a pseudo-overlay technique — we use a native placeholder colored with CSS */}
        <style>{`input::placeholder { color: ${ct.placeholder}; }`}</style>

        {/* Clear button */}
        {searchQuery && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: ct.glass, color: ct.icon }}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}

        {/* Recent searches dropdown */}
        {showHistory && history.length > 0 && !searchQuery && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 z-40"
            style={{
              backgroundColor: 'var(--ui-bg-elevated)',
              border: `1px solid ${ct.border}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <p className="text-[10px] font-bold px-3 py-2 uppercase tracking-widest" style={{ color: ct.icon }}>
              Recent searches
            </p>
            {history.map((h) => (
              <button
                key={h}
                onClick={() => { setSearchQuery(h); setShowHistory(false); }}
                className="w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center gap-3 transition-colors"
                style={{ color: ct.text }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ct.glass)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: ct.icon }}>history</span>
                {h}
              </button>
            ))}
            <div className="mx-3 my-1" style={{ borderTop: `1px solid ${ct.border}` }} />
            <button
              onClick={() => { setHistory([]); db.saveMetadata('search_history', []); setShowHistory(false); }}
              className="w-full text-center py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
            >
              Clear history
            </button>
          </div>
        )}
      </div>

      {/* Collections row */}
      {collections.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
              onContextMenu={(e) => { e.preventDefault(); removeCollection(col.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 border transition-all"
              style={{
                borderColor: activeCollection === col.id ? col.color : 'var(--ui-border)',
                backgroundColor: activeCollection === col.id ? col.color + '33' : 'rgba(255,255,255,0.04)',
                color: activeCollection === col.id ? col.color : undefined,
              }}
            >
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
              {col.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewColl(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 border border-ui-border opacity-40 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-xs">add</span> New
          </button>
        </div>
      )}

      {/* New collection form */}
      {showNewColl && (
        <div className="glass rounded-2xl p-4 space-y-3 border border-ui-border animate-in fade-in zoom-in-95">
          <p className="text-xs font-bold opacity-60">New Collection</p>
          <input
            autoFocus
            value={newCollName}
            onChange={(e) => setNewCollName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCollection()}
            placeholder="Collection name..."
            className="w-full bg-ui-bg-muted border border-ui-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            {COLL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCollColor(c)}
                className="size-6 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: newCollColor === c ? 'white' : 'transparent' }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={createCollection} className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl">Create</button>
            <button onClick={() => setShowNewColl(false)} className="flex-1 py-2 glass text-xs font-bold rounded-xl opacity-60">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter + Sort + View toggle */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveFilter(cat); setActiveCollection(null); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border shrink-0 ${
                activeFilter === cat && !activeCollection
                  ? 'bg-primary border-primary text-white shadow-lg'
                  : 'glass text-current opacity-60 hover:opacity-100'
              }`}
            >
              {cat}
            </button>
          ))}
          {collections.length === 0 && (
            <button
              onClick={() => setShowNewColl(true)}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-dashed border-ui-border opacity-40 hover:opacity-70 shrink-0 transition-opacity"
            >
              + Collection
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleView} className="size-9 glass rounded-xl flex items-center justify-center hover:bg-ui-bg-accented transition-colors">
            <span className="material-symbols-outlined text-lg">{isGrid ? 'view_list' : 'grid_view'}</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowSort(!showSort)} className="size-9 glass rounded-xl flex items-center justify-center hover:bg-ui-bg-accented transition-colors">
              <span className="material-symbols-outlined text-lg">sort</span>
            </button>
            {showSort && (
              <div className="absolute top-full right-0 mt-2 w-40 glass rounded-2xl p-2 border border-ui-border shadow-2xl z-40 animate-in fade-in zoom-in-95">
                {(['title', 'author', 'date'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setShowSort(false); db.saveMetadata('sort_pref', opt); }}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all capitalize ${
                      sortBy === opt ? 'bg-primary text-white' : 'hover:bg-ui-bg-muted opacity-60 hover:opacity-100'
                    }`}
                  >
                    By {opt === 'date' ? 'Last Read' : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book grid / list */}
      <section className="pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">
            {activeCollection ? collections.find((c) => c.id === activeCollection)?.name : 'Library'}
          </h2>
          <span className="text-[10px] font-bold opacity-30 uppercase">{filteredBooks.length} Items</span>
        </div>

        {filteredBooks.length > 0 ? (
          <div ref={menuRef} className={isGrid ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
            {filteredBooks.map((book) => (
              isGrid ? (
                /* Grid Card */
                <div key={book.id} className="relative glass rounded-2xl p-3 border border-ui-border hover:border-primary/30 transition-all group active:scale-95">
                  <div onClick={() => onOpenBook(book)} className="cursor-pointer">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-ui-bg-accented">
                      {book.coverUrl
                        ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center opacity-20"><span className="material-symbols-outlined text-5xl">auto_stories</span></div>
                      }
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-[8px] font-bold uppercase tracking-tighter text-white">{book.type}</div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                        <div className="h-full bg-primary transition-all" style={{ width: `${book.progress}%` }} />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] opacity-40 uppercase tracking-widest truncate">{book.author}</p>
                      <p className="text-[9px] font-bold text-primary shrink-0">{book.progress}%</p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onFavorite(book.id); }}
                      className="size-6 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-md"
                      style={{ color: book.isFavorite ? 'var(--color-favorite)' : 'rgba(255,255,255,0.5)' }}
                    >
                      <span className="material-symbols-outlined text-sm" style={book.isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setBookMenu(bookMenu === book.id ? null : book.id); }}
                      className="size-6 flex items-center justify-center rounded-lg text-white/50 bg-black/40 backdrop-blur-md hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  </div>
                  {/* Context menu */}
                  {bookMenu === book.id && (
                    <div className="absolute top-8 right-1 z-50 w-44 glass rounded-2xl p-2 border border-ui-border shadow-2xl animate-in fade-in zoom-in-95">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddToCollMenu(book.id); }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-ui-bg-muted flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm opacity-50">folder_open</span> Add to Collection
                      </button>
                      {addToCollMenu === book.id && collections.length > 0 && (
                        <div className="pl-4 pb-1">
                          {collections.map((c) => (
                            <button
                              key={c.id}
                              onClick={(e) => { e.stopPropagation(); addBookToCollection(book.id, c.id); }}
                              className="w-full text-left px-2 py-1.5 text-xs rounded-lg hover:bg-ui-bg-muted flex items-center gap-2"
                            >
                              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(book.id); setBookMenu(null); }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Delete
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* List Row */
                <div key={book.id} className="relative glass rounded-2xl px-4 py-3 border border-ui-border hover:border-primary/20 transition-all flex items-center gap-4 group active:scale-[0.99]">
                  <div onClick={() => onOpenBook(book)} className="flex items-center gap-4 flex-1 cursor-pointer min-w-0">
                    <div className="size-14 rounded-xl overflow-hidden bg-ui-bg-accented shrink-0">
                      {book.coverUrl
                        ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center opacity-20"><span className="material-symbols-outlined">auto_stories</span></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{book.title}</h3>
                        {book.isFavorite && <span className="material-symbols-outlined text-xs text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                      </div>
                      <p className="text-[10px] opacity-40 truncate">{book.author}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-ui-bg-accented rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${book.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-primary shrink-0">{book.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onFavorite(book.id)} className="size-8 flex items-center justify-center rounded-xl hover:bg-ui-bg-accented" style={{ color: book.isFavorite ? 'var(--color-favorite)' : 'rgba(255,255,255,0.4)' }}>
                      <span className="material-symbols-outlined text-sm" style={book.isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                    </button>
                    <button onClick={() => onDelete(book.id)} className="size-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-red-400/60 hover:text-red-400">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4 font-light">library_books</span>
            <p className="text-sm font-medium">No documents found.</p>
          </div>
        )}
      </section>

      {(showHistory || showSort) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowHistory(false); setShowSort(false); }} />
      )}
    </div>
  );
};

export default Library;
