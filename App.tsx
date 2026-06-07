
import React, { useState, useRef, useEffect } from 'react';
import { Book, BookType, ViewType, UserSettings } from './types';
import Library from './components/Library';
import ReaderView from './components/ReaderView';
import Profile from './components/Profile';
import Discover from './components/Discover';
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
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flux',
    theme: 'dark',
    dailyGoal: 10,
  });

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
  }, []);

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

  // Core file processing — shared by upload and Discover download
  const processFile = async (file: File) => {
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
    setCurrentView(ViewType.HOME);
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

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.epub,.cbr,.cbz"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default App;
