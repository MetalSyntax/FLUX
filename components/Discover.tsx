
import React, { useState, useEffect } from 'react';
import { Book, BookType } from '../types';

interface GBook {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>;
  download_count: number;
  subjects: string[];
}

interface DiscoverProps {
  library: Book[];
  onOpenBook: (book: Book) => void;
  onAddBook: (file: File) => void;
}

const formatAuthor = (name: string) =>
  name.includes(',') ? name.split(',').reverse().join(' ').trim() : name;

const getCover = (book: GBook) =>
  book.formats['image/jpeg'] ||
  `https://picsum.photos/seed/gb${book.id}/400/600`;

const getEpubUrl = (book: GBook) =>
  book.formats['application/epub+zip'] || book.formats['application/epub'];

const Discover: React.FC<DiscoverProps> = ({ library, onOpenBook, onAddBook }) => {
  const [featured, setFeatured] = useState<GBook[]>([]);
  const [popular, setPopular] = useState<GBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };
  
  // In-app browser state
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          'https://gutendex.com/books/?sort=popular&mime_type=application%2Fepub%2Bzip&page=1'
        );
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const results: GBook[] = data.results || [];
        setFeatured(results.slice(0, 3));
        setPopular(results.slice(3, 11));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (gbook: GBook) => {
    const epubUrl = getEpubUrl(gbook);
    if (!epubUrl) return;
    setDownloading(gbook.id);
    try {
      const res = await fetch(epubUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const file = new File([blob], `${gbook.title}.epub`, { type: 'application/epub+zip' });
      onAddBook(file);
    } catch {
      try {
        // Fallback using CORS proxy to ensure we get the blob and keep the user in the app
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(epubUrl)}`;
        const resProxy = await fetch(proxyUrl);
        if (!resProxy.ok) throw new Error('proxy fetch failed');
        const blobProxy = await resProxy.blob();
        const fileProxy = new File([blobProxy], `${gbook.title}.epub`, { type: 'application/epub+zip' });
        onAddBook(fileProxy);
      } catch (e) {
        showToast("Error downloading the book. The file might be too large or unavailable.");
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleAnnaSearch = () => {
    if (!searchQuery.trim()) return;
    setIframeUrl(`https://annas-archive.gl/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleLibgenSearch = () => {
    if (!searchQuery.trim()) return;
    // Using one of the requested Libgen mirrors
    setIframeUrl(`https://libgen.li/index.php?req=${encodeURIComponent(searchQuery)}`);
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setIsSearching(true);
    setHasSearched(true);
    setError(false);
    try {
      const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}&mime_type=application%2Fepub%2Bzip`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const inLibrary = (id: number) =>
    library.some((b) => b.title.toLowerCase().includes(String(id)));

  const lastRead = [...library].sort((a, b) => b.lastReadDate - a.lastReadDate)[0];

  const Skeleton = () => (
    <div className="flex-none w-[85vw] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse snap-center" />
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] glass border border-red-500/50 bg-red-500/20 text-white px-6 py-3 rounded-full shadow-2xl text-xs font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Global Search Bar */}
      <section className="px-6 relative z-30">
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl opacity-40 pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Search books & authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 rounded-3xl pl-12 pr-4 text-sm outline-none transition-all bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="h-14 px-5 rounded-3xl bg-primary text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-primary/90 flex items-center gap-2"
          >
            {isSearching ? <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Search'}
          </button>
        </form>
        {searchQuery.trim() && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAnnaSearch}
              className="flex-1 py-3 rounded-2xl glass border border-white/5 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-[10px] font-bold opacity-80"
            >
              <span className="material-symbols-outlined text-sm">public</span> Anna's Archive
            </button>
            <button
              onClick={handleLibgenSearch}
              className="flex-1 py-3 rounded-2xl glass border border-white/5 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-[10px] font-bold opacity-80"
            >
              <span className="material-symbols-outlined text-sm">book</span> Library Genesis
            </button>
          </div>
        )}
      </section>

      {/* Search Results */}
      {hasSearched && (
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Search Results</h2>
            <button onClick={() => { setHasSearched(false); setSearchQuery(''); }} className="text-xs font-bold opacity-40 uppercase tracking-widest hover:text-primary transition-colors">Clear</button>
          </div>
          {isSearching ? (
             <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
               {[1, 2, 3].map(i => <Skeleton key={i} />)}
             </div>
          ) : searchResults.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center opacity-40 border border-white/5">
              <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
              <p className="text-xs font-medium">No results found on Project Gutenberg.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-4">
              {searchResults.map((book) => (
                <div key={book.id} className="relative flex-none w-[85vw] aspect-[4/5] rounded-3xl overflow-hidden snap-center group shadow-2xl">
                  <img
                    src={getCover(book)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={book.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/gb${book.id}/400/600`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 glass rounded-2xl p-4 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base leading-tight line-clamp-2">{book.title}</p>
                      <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.15em] mt-1 truncate">
                        {book.authors[0] ? formatAuthor(book.authors[0].name) : 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(book)}
                      disabled={downloading === book.id}
                      className="size-11 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg shrink-0 disabled:opacity-60"
                    >
                      {downloading === book.id
                        ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-xl">download</span>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Continue Reading */}
      {lastRead && (
        <section className="px-6">
          <div
            onClick={() => onOpenBook(lastRead)}
            className="glass rounded-2xl p-4 flex items-center gap-4 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
          >
            <div className="size-16 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
              {lastRead.coverUrl
                ? <img src={lastRead.coverUrl} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><span className="material-symbols-outlined opacity-40">auto_stories</span></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Continue Reading</p>
              <p className="text-sm font-bold leading-tight truncate group-hover:text-primary transition-colors">{lastRead.title}</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${lastRead.progress}%` }} />
              </div>
              <p className="text-[9px] opacity-30 mt-1">{lastRead.progress}% complete</p>
            </div>
            <span className="material-symbols-outlined text-4xl text-primary shrink-0">play_circle</span>
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Featured</h2>
          <span className="text-[10px] opacity-30 uppercase tracking-widest">Project Gutenberg</span>
        </div>

        {error ? (
          <div className="glass rounded-2xl p-6 text-center opacity-40">
            <span className="material-symbols-outlined text-3xl mb-2">wifi_off</span>
            <p className="text-xs">Could not load books. Check your connection.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4">
            {loading
              ? [1, 2, 3].map((i) => <Skeleton key={i} />)
              : featured.map((book) => (
                <div key={book.id} className="relative flex-none w-[85vw] aspect-[4/5] rounded-3xl overflow-hidden snap-center group shadow-2xl">
                  <img
                    src={getCover(book)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={book.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/gb${book.id}/400/600`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 glass rounded-2xl p-4 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base leading-tight line-clamp-2">{book.title}</p>
                      <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.15em] mt-1 truncate">
                        {book.authors[0] ? formatAuthor(book.authors[0].name) : 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(book)}
                      disabled={downloading === book.id}
                      className="size-11 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-primary/40 shrink-0 disabled:opacity-60"
                    >
                      {downloading === book.id
                        ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-xl">download</span>
                      }
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Popular */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Most Downloaded</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {loading
            ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-none w-28">
                <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse mb-2" />
                <div className="h-3 bg-white/5 rounded animate-pulse mb-1" />
                <div className="h-2 bg-white/5 rounded animate-pulse w-2/3" />
              </div>
            ))
            : popular.map((book) => (
              <div key={book.id} className="flex-none w-28 cursor-pointer group" onClick={() => handleAdd(book)}>
                <div className="aspect-[2/3] w-full rounded-xl glass border border-white/10 mb-2 overflow-hidden shadow-md relative">
                  <img
                    src={getCover(book)}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/gb${book.id}/300/450`; }}
                  />
                  {downloading === book.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{book.title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                  {book.authors[0] ? formatAuthor(book.authors[0].name) : 'Unknown'}
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* Genres */}
      {!loading && !error && (
        <section className="px-6">
          <h2 className="text-lg font-bold mb-4">Browse by Genre</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Adventure', icon: 'explore', color: '#2563eb' },
              { label: 'Romance', icon: 'favorite', color: '#dc2626' },
              { label: 'Mystery', icon: 'search', color: '#7c3aed' },
              { label: 'Science', icon: 'science', color: '#16a34a' },
            ].map((g) => (
              <button
                key={g.label}
                onClick={() => executeSearch(g.label)}
                className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: g.color + '22' }}>
                  <span className="material-symbols-outlined" style={{ color: g.color }}>{g.icon}</span>
                </div>
                <span className="text-sm font-bold group-hover:text-primary transition-colors">{g.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* In-app Browser Overlay */}
      {iframeUrl && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="h-16 flex items-center justify-between px-4 bg-slate-900 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-primary">public</span>
              <span className="text-xs font-mono opacity-60 truncate">{iframeUrl}</span>
            </div>
            <button
              onClick={() => setIframeUrl(null)}
              className="size-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <iframe
            src={iframeUrl}
            className="w-full flex-1 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      )}
    </div>
  );
};

export default Discover;
