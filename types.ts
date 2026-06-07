
export enum BookType {
  CBR = 'CBR',
  PDF = 'PDF',
  EPUB = 'EPUB'
}

export enum ViewType {
  HOME = 'home',
  DISCOVER = 'discover',
  PROFILE = 'profile',
  READER = 'reader'
}

export interface UserSettings {
  name: string;
  avatar: string;
  theme: 'dark' | 'black' | 'white';
  dailyGoal: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  type: BookType;
  progress: number;
  lastRead: string;
  lastReadDate: number;
  currentPage: number;
  totalPages: number;
  file?: File;
  isFavorite?: boolean;
  tags?: string[];
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  cfi?: string;
  label: string;
  color: string;
  createdAt: number;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startTime: number;
  endTime: number;
  pagesRead: number;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  bookIds: string[];
}
