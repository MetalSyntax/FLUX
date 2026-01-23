
import { Book, UserSettings } from './types';

const DB_NAME = 'GlassReaderDB';
const DB_VERSION = 2; // Incremented for new stores

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveBook = async (book: Book) => {
  const db = await openDB();
  const tx = db.transaction('books', 'readwrite');
  tx.objectStore('books').put(book);
  return new Promise((res) => tx.oncomplete = () => res(true));
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
  const tx = db.transaction('books', 'readwrite');
  tx.objectStore('books').delete(id);
};

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

// New Metadata helper for Sort and History
export const saveMetadata = async (key: string, value: any) => {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readwrite');
  tx.objectStore('metadata').put(value, key);
};

export const getMetadata = async (key: string): Promise<any> => {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readonly');
  const request = tx.objectStore('metadata').get(key);
  return new Promise((res) => request.onsuccess = () => res(request.result));
};
