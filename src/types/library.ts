export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  publishedYear?: number;
  read: boolean;
  readBy?: string[];
  owner?: string;
  addedAt: string;
}

export interface Library {
  id: string;
  name: string;
  createdAt: string;
  books: Book[];
}

