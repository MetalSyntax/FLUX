
import { Book, UserSettings, Bookmark, ReadingSession, Collection } from './types';

const DB_NAME = 'FluxDB';
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      if (!db.objectStoreNames.contains('bookmarks')) db.createObjectStore('bookmarks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('collections')) db.createObjectStore('collections', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Books — never persists the File object itself
export const saveBook = async (book: Book) => {
  const { file, ...bookData } = book;
  const db = await openDB();
  const tx = db.transaction('books', 'readwrite');
  tx.objectStore('books').put(bookData);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
};

export const getAllBooks = async (): Promise<Book[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('books', 'readonly');
    const request = tx.objectStore('books').getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteBook = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction(['books', 'files'], 'readwrite');
  tx.objectStore('books').delete(id);
  tx.objectStore('files').delete(id);
};

// File persistence — stores ArrayBuffer separately keyed by book.id
export const saveFile = async (bookId: string, buffer: ArrayBuffer, name: string, type: string) => {
  const db = await openDB();
  const tx = db.transaction('files', 'readwrite');
  tx.objectStore('files').put({ buffer, name, type }, bookId);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
};

export const getFile = async (bookId: string): Promise<File | null> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('files', 'readonly');
    const request = tx.objectStore('files').get(bookId);
    request.onsuccess = () => {
      const data = request.result;
      if (!data) { resolve(null); return; }
      resolve(new File([data.buffer], data.name, { type: data.type }));
    };
  });
};

// Settings
export const saveSettings = async (settings: UserSettings) => {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put(settings, 'user_config');
};

export const getSettings = async (): Promise<UserSettings | null> => {
  const db = await openDB();
  const tx = db.transaction('settings', 'readonly');
  const request = tx.objectStore('settings').get('user_config');
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
  });
};

// Metadata (sort preference, search history, etc.)
export const saveMetadata = async (key: string, value: any) => {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readwrite');
  tx.objectStore('metadata').put(value, key);
};

export const getMetadata = async (key: string): Promise<any> => {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readonly');
  const request = tx.objectStore('metadata').get(key);
  return new Promise((res) => (request.onsuccess = () => res(request.result)));
};

// Bookmarks
export const saveBookmark = async (bookmark: Bookmark) => {
  const db = await openDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  tx.objectStore('bookmarks').put(bookmark);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
};

export const getBookmarks = async (bookId: string): Promise<Bookmark[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('bookmarks', 'readonly');
    const request = tx.objectStore('bookmarks').getAll();
    request.onsuccess = () =>
      resolve((request.result as Bookmark[]).filter((b) => b.bookId === bookId));
  });
};

export const deleteBookmark = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  tx.objectStore('bookmarks').delete(id);
};

// Reading Sessions
export const saveSession = async (session: ReadingSession) => {
  const db = await openDB();
  const tx = db.transaction('sessions', 'readwrite');
  tx.objectStore('sessions').put(session);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
};

export const getSessions = async (): Promise<ReadingSession[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sessions', 'readonly');
    const request = tx.objectStore('sessions').getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

// Collections
export const saveCollection = async (col: Collection) => {
  const db = await openDB();
  const tx = db.transaction('collections', 'readwrite');
  tx.objectStore('collections').put(col);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
};

export const getCollections = async (): Promise<Collection[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('collections', 'readonly');
    const request = tx.objectStore('collections').getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteCollection = async (id: string) => {
  const db = await openDB();
  const tx = db.transaction('collections', 'readwrite');
  tx.objectStore('collections').delete(id);
};

export const getFileSizes = async (): Promise<{ [bookId: string]: number }> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.openCursor();
    const sizes: { [bookId: string]: number } = {};
    request.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const value = cursor.value;
        if (value && value.buffer) {
          sizes[cursor.key] = value.buffer.byteLength;
        }
        cursor.continue();
      } else {
        resolve(sizes);
      }
    };
  });
};
