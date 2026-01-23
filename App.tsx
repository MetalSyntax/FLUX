
import React, { useState, useRef, useEffect } from 'react';
import { Book, BookType, ViewType, UserSettings } from './types';
import Library from './components/Library';
import ReaderView from './components/ReaderView';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import TopNav from './components/TopNav';
import * as db from './db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.HOME);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [library, setLibrary] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Reader',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Glass',
    theme: 'dark'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const savedBooks = await db.getAllBooks();
      setLibrary(savedBooks);
      const savedSettings = await db.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
        applyTheme(savedSettings.theme);
      }
    };
    init();
  }, []);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    root.classList.remove('theme-white', 'theme-black', 'dark');
    if (theme === 'white') root.classList.add('theme-white');
    else if (theme === 'black') root.classList.add('theme-black');
    else root.classList.add('dark');
  };

  const handleOpenBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentView(ViewType.READER);
  };

  const handleUpdateProgress = async (bookId: string, page: number, total?: number, cover?: string) => {
    setLibrary(prev => prev.map(b => {
      if (b.id === bookId) {
        const totalPages = total || b.totalPages;
        const progress = Math.round((page / totalPages) * 100);
        const updated = { 
          ...b, 
          currentPage: page, 
          totalPages, 
          progress, 
          lastReadDate: Date.now(), 
          lastRead: 'Just now',
          coverUrl: cover || b.coverUrl
        };
        db.saveBook(updated);
        return updated;
      }
      return b;
    }));
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    applyTheme(newSettings.theme);
    await db.saveSettings(newSettings);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toUpperCase();
    let type = BookType.PDF;
    if (extension === 'CBR' || extension === 'CBZ') type = BookType.CBR;
    if (extension === 'EPUB') type = BookType.EPUB;

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: extension === 'CBR' || extension === 'CBZ' ? "Manga/Comic" : "Electronic Book",
      coverUrl: '', // Will be updated on first open
      type: type,
      progress: 0,
      lastRead: 'Just added',
      lastReadDate: Date.now(),
      currentPage: 1,
      totalPages: 1,
      file: file
    };

    await db.saveBook(newBook);
    setLibrary([newBook, ...library]);
    setCurrentView(ViewType.HOME);
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden transition-colors duration-300">
      {currentView !== ViewType.READER && (
        <TopNav settings={settings} onProfileClick={() => setCurrentView(ViewType.PROFILE)} />
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
            onDelete={async (id) => {
              await db.deleteBook(id);
              setLibrary(prev => prev.filter(b => b.id !== id));
            }}
          />
        )}

        {currentView === ViewType.PROFILE && (
          <Profile settings={settings} onUpdate={handleUpdateSettings} library={library} />
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

      {currentView !== ViewType.READER && (
        <BottomNav 
          activeView={currentView} 
          onNavigate={setCurrentView} 
          onAddClick={() => fileInputRef.current?.click()}
        />
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.epub,.cbr,.cbz" onChange={handleFileUpload} />
    </div>
  );
};

export default App;
