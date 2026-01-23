
export enum BookType {
  CBR = 'CBR',
  PDF = 'PDF',
  EPUB = 'EPUB'
}

export enum ViewType {
  HOME = 'home',
  BOOKSHELF = 'bookshelf',
  PROFILE = 'profile',
  READER = 'reader',
  DISCOVER = 'discover'
}

export interface UserSettings {
  name: string;
  avatar: string;
  theme: 'dark' | 'black' | 'white';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  type: BookType;
  progress: number;
  lastRead: string;
  lastReadDate: number; // Timestamp for sorting
  currentPage: number;
  totalPages: number;
  file?: File;
  fileBlobUrl?: string;
}
