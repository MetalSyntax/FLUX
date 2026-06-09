
import React, { useState, useRef, useEffect } from 'react';
import { Book, BookType, ViewType, UserSettings } from './types';
import Library from './components/Library';
import ReaderView from './components/ReaderView';
import Profile from './components/Profile';
import Discover from './components/Discover';
import Stats from './components/Stats';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import * as db from './db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.HOME);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [library, setLibrary] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Reader',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flux',
    theme: 'dark',
    dailyGoal: 10,
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const savedBooks = await db.getAllBooks();
      setLibrary(savedBooks);
      const savedSettings = await db.getSettings();
      if (savedSettings) {
        setSettings({ dailyGoal: 10, ...savedSettings });
        applyTheme(savedSettings.theme);
      }
    };
    init();
    checkForUpdates();
  }, []);

  const checkForUpdates = async (manual = false) => {
    if (manual) setIsCheckingUpdate(true);
    try {
      const res = await fetch('https://api.github.com/repos/MetalSyntax/FLUX/commits/main');
      const data = await res.json();
      if (!data.sha) throw new Error('No sha');
      const latestSha = data.sha;
      const currentSha = localStorage.getItem('flux_version_sha');
      
      if (!currentSha) {
        localStorage.setItem('flux_version_sha', latestSha);
        if (manual) alert('You are already on the latest version!');
      } else if (currentSha !== latestSha) {
        setUpdateAvailable(true);
      } else {
        if (manual) alert('You are already on the latest version!');
      }
    } catch {
      if (manual) alert('Could not check for updates. Try again later.');
    } finally {
      if (manual) setIsCheckingUpdate(false);
    }
  };

  const handleUpdateAccept = async () => {
    try {
      const res = await fetch('https://api.github.com/repos/MetalSyntax/FLUX/commits/main');
      const data = await res.json();
      localStorage.setItem('flux_version_sha', data.sha);
      // Clear all caches so PWA fetches the new deployment
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      window.location.reload();
    } catch {
      setUpdateAvailable(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    root.classList.remove('theme-white', 'theme-black', 'dark');
    if (theme === 'white') root.classList.add('theme-white');
    else if (theme === 'black') root.classList.add('theme-black');
    else root.classList.add('dark');
  };

  // Open book: load file from IndexedDB if not in memory
  const handleOpenBook = async (book: Book) => {
    let bookToOpen = book;
    if (!book.file) {
      const file = await db.getFile(book.id);
      if (file) bookToOpen = { ...book, file };
    }
    setSelectedBook(bookToOpen);
    setCurrentView(ViewType.READER);
  };

  const handleUpdateProgress = async (bookId: string, page: number, total?: number, cover?: string, cfi?: string) => {
    setLibrary((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const totalPages = total || b.totalPages;
        const progress = Math.round((page / totalPages) * 100);
        const updated: Book = {
          ...b,
          currentPage: page,
          totalPages,
          progress,
          lastReadDate: Date.now(),
          lastRead: 'Just now',
          coverUrl: cover || b.coverUrl,
          ...(cfi !== undefined ? { currentCfi: cfi } : {}),
        };
        db.saveBook(updated);
        return updated;
      })
    );
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    applyTheme(newSettings.theme);
    await db.saveSettings(newSettings);
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    const ext = file.name.split('.').pop()?.toUpperCase();
    let type = BookType.PDF;
    if (ext === 'CBR' || ext === 'CBZ') type = BookType.CBR;
    if (ext === 'EPUB') type = BookType.EPUB;

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      author: type === BookType.CBR ? 'Manga / Comic' : 'E-Book',
      coverUrl: '',
      type,
      progress: 0,
      lastRead: 'Just added',
      lastReadDate: Date.now(),
      currentPage: 1,
      totalPages: 1,
      file,
    };

    // Persist the file as ArrayBuffer so it survives tab closes
    const buffer = await file.arrayBuffer();
    await db.saveFile(newBook.id, buffer, file.name, file.type);
    await db.saveBook(newBook);
    setLibrary((prev) => [newBook, ...prev]);
    setIsUploading(false);
    handleOpenBook(newBook);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processFile(file);
  };

  const handleAddFromDiscover = async (file: File) => {
    await processFile(file);
  };

  const handleDelete = async (id: string) => {
    await db.deleteBook(id);
    setLibrary((prev) => prev.filter((b) => b.id !== id));
  };

  const handleFavorite = async (id: string) => {
    setLibrary((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, isFavorite: !b.isFavorite };
        db.saveBook(updated);
        return updated;
      })
    );
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden transition-colors duration-300">
      {currentView !== ViewType.READER && currentView !== ViewType.TERMS && currentView !== ViewType.PRIVACY && (
        <TopNav settings={settings} onProfileClick={() => setCurrentView(ViewType.PROFILE)} />
      )}

      {/* Basic header with back button for legal pages */}
      {(currentView === ViewType.TERMS || currentView === ViewType.PRIVACY) && (
        <div className="pt-12 pb-4 px-6 flex items-center gap-4">
          <button onClick={() => setCurrentView(ViewType.PROFILE)} className="size-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-bold tracking-widest uppercase text-sm opacity-60">Back to Profile</h2>
        </div>
      )}

      <main className={`flex-1 z-10 ${currentView !== ViewType.READER ? 'pb-28 pt-4' : ''}`}>
        {currentView === ViewType.HOME && (
          <Library
            books={library}
            onOpenBook={handleOpenBook}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onDelete={handleDelete}
            onFavorite={handleFavorite}
            settings={settings}
          />
        )}

        {currentView === ViewType.DISCOVER && (
          <Discover
            library={library}
            onOpenBook={handleOpenBook}
            onAddBook={handleAddFromDiscover}
          />
        )}

        {currentView === ViewType.PROFILE && (
          <Profile 
            settings={settings} 
            onUpdate={handleUpdateSettings} 
            library={library} 
            onCheckUpdate={() => checkForUpdates(true)}
            isCheckingUpdate={isCheckingUpdate}
            onNavigate={(view: string) => setCurrentView(view as ViewType)}
          />
        )}

        {currentView === ViewType.TERMS && <Terms />}
        {currentView === ViewType.PRIVACY && <Privacy />}

        {currentView === ViewType.STATS && (
          <Stats library={library} settings={settings} />
        )}

        {currentView === ViewType.READER && selectedBook && (
          <ReaderView
            book={selectedBook}
            settings={settings}
            onClose={() => setCurrentView(ViewType.HOME)}
            onProgressUpdate={handleUpdateProgress}
          />
        )}
      </main>

      {currentView !== ViewType.READER && currentView !== ViewType.TERMS && currentView !== ViewType.PRIVACY && (
        <BottomNav
          activeView={currentView}
          onNavigate={setCurrentView}
          onAddClick={() => fileInputRef.current?.click()}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.epub,.cbr,.cbz"
        onChange={handleFileUpload}
      />
      {isUploading && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 border border-white/20">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-white font-bold tracking-widest uppercase text-sm">Loading Book...</p>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateAvailable && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm glass-premium rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">update</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Update Available</h3>
            <p className="text-xs opacity-60 mb-6">A new version of FLUX has been pushed to GitHub. Would you like to update the app now?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setUpdateAvailable(false)} 
                className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateAccept} 
                className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg transition-colors"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
