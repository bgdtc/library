import { Book } from '../types/library';

/**
 * Génère une image SVG avec le titre du livre comme fallback
 */
function generateTitleImage(title: string, author?: string): string {
  // Échapper les caractères spéciaux pour XML
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  // Limiter la longueur du titre pour l'affichage
  const maxTitleLength = 35;
  const displayTitle = title.length > maxTitleLength 
    ? title.substring(0, maxTitleLength) + '...' 
    : title;
  
  // Couleurs style Apple
  const colors = [
    { bg: '#007AFF', text: '#FFFFFF' },
    { bg: '#5856D6', text: '#FFFFFF' },
    { bg: '#FF3B30', text: '#FFFFFF' },
    { bg: '#FF9500', text: '#FFFFFF' },
    { bg: '#34C759', text: '#FFFFFF' },
    { bg: '#5AC8FA', text: '#FFFFFF' },
    { bg: '#AF52DE', text: '#FFFFFF' },
    { bg: '#FF2D55', text: '#FFFFFF' },
  ];
  
  // Choisir une couleur basée sur le hash du titre pour la cohérence
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  
  // Diviser le titre en lignes (max 3 lignes)
  const words = displayTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= 25 && lines.length < 3) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break;
    }
  }
  if (currentLine && lines.length < 3) lines.push(currentLine);
  
  const titleLines = lines.map(line => 
    `<tspan x="150" dy="${lines.indexOf(line) === 0 ? '0' : '32'}" text-anchor="middle">${escapeXml(line)}</tspan>`
  ).join('');
  
  const authorText = author 
    ? `<text x="150" y="280" font-family="Arial, sans-serif" font-size="14" font-weight="400" fill="${color.text}dd" text-anchor="middle" dominant-baseline="middle">${escapeXml(author.length > 28 ? author.substring(0, 28) + '...' : author)}</text>`
    : '';
  
  const svg = `<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.bg}dd;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#grad${hash})"/>
    <text x="150" y="180" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="${color.text}" text-anchor="middle" dominant-baseline="middle" style="letter-spacing: -0.3px;">
      ${titleLines}
    </text>
    ${authorText}
  </svg>`;
  
  // Encoder le SVG en data URI
  const encoded = encodeURIComponent(svg);
  return 'data:image/svg+xml;charset=utf-8,' + encoded;
}

interface OpenLibraryResponse {
  [key: string]: {
    title?: string;
    authors?: Array<{ name: string }>;
    cover?: {
      small?: string;
      medium?: string;
      large?: string;
    };
    publish_date?: string;
  };
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title?: string;
      authors?: string[];
      publishedDate?: string;
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
        medium?: string;
        large?: string;
      };
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
    };
  }>;
}

async function fetchFromOpenLibrary(cleanISBN: string): Promise<Book | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data: OpenLibraryResponse = await response.json();
    const bookKey = `ISBN:${cleanISBN}`;
    const bookData = data[bookKey];
    
    if (!bookData || !bookData.title) {
      return null;
    }
    
    // Extraire l'année de publication
    let publishedYear: number | undefined;
    if (bookData.publish_date) {
      const yearMatch = bookData.publish_date.match(/\d{4}/);
      if (yearMatch) {
        publishedYear = parseInt(yearMatch[0], 10);
      }
    }
    
    // Récupérer la meilleure image de couverture disponible
    let coverUrl: string | undefined;
    if (bookData.cover) {
      coverUrl = bookData.cover.large || bookData.cover.medium || bookData.cover.small;
    }
    
    const authors = bookData.authors?.map(author => author.name) || ['Auteur inconnu'];
    
    // Si pas d'image, générer une image avec le titre
    if (!coverUrl) {
      coverUrl = generateTitleImage(bookData.title, authors[0]);
    }
    
    const book: Book = {
      isbn: cleanISBN,
      title: bookData.title,
      authors,
      coverUrl,
      publishedYear,
      read: false,
      addedAt: new Date().toISOString(),
    };
    
    return book;
  } catch (error) {
    console.debug('Open Library API error:', error);
    return null;
  }
}

async function fetchFromGoogleBooks(cleanISBN: string): Promise<Book | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data: GoogleBooksResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const volumeInfo = data.items[0].volumeInfo;
    if (!volumeInfo || !volumeInfo.title) {
      return null;
    }
    
    // Extraire l'année de publication
    let publishedYear: number | undefined;
    if (volumeInfo.publishedDate) {
      const yearMatch = volumeInfo.publishedDate.match(/\d{4}/);
      if (yearMatch) {
        publishedYear = parseInt(yearMatch[0], 10);
      }
    }
    
    // Récupérer la meilleure image de couverture disponible
    let coverUrl: string | undefined;
    if (volumeInfo.imageLinks) {
      coverUrl = volumeInfo.imageLinks.large || 
                 volumeInfo.imageLinks.medium || 
                 volumeInfo.imageLinks.thumbnail?.replace('zoom=1', 'zoom=2') ||
                 volumeInfo.imageLinks.thumbnail ||
                 volumeInfo.imageLinks.smallThumbnail?.replace('zoom=1', 'zoom=2');
    }
    
    const authors = volumeInfo.authors || ['Auteur inconnu'];
    
    // Si pas d'image, générer une image avec le titre
    if (!coverUrl) {
      coverUrl = generateTitleImage(volumeInfo.title, authors[0]);
    }
    
    const book: Book = {
      isbn: cleanISBN,
      title: volumeInfo.title,
      authors,
      coverUrl,
      publishedYear,
      read: false,
      addedAt: new Date().toISOString(),
    };
    
    return book;
  } catch (error) {
    console.debug('Google Books API error:', error);
    return null;
  }
}

export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  // Nettoyer l'ISBN (enlever les tirets et espaces)
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  // Essayer d'abord Open Library
  let book = await fetchFromOpenLibrary(cleanISBN);
  
  // Si Open Library ne trouve pas le livre, essayer Google Books
  if (!book) {
    console.log('Livre non trouvé sur Open Library, tentative avec Google Books...');
    book = await fetchFromGoogleBooks(cleanISBN);
  }
  
  // Si toujours rien, essayer avec l'ISBN-10 si c'est un ISBN-13
  if (!book && cleanISBN.length === 13) {
    // Convertir ISBN-13 en ISBN-10 (simplifié - on essaie juste sans les 3 premiers chiffres si c'est 978)
    if (cleanISBN.startsWith('978')) {
      const isbn10 = cleanISBN.substring(3, 12);
      console.log('Tentative avec ISBN-10:', isbn10);
      book = await fetchFromOpenLibrary(isbn10);
      if (!book) {
        book = await fetchFromGoogleBooks(isbn10);
      }
    }
  }
  
  // Si le livre existe mais n'a pas d'image, générer une image avec le titre
  if (book && !book.coverUrl) {
    book.coverUrl = generateTitleImage(book.title, book.authors[0]);
  }
  
  if (!book) {
    console.warn('Livre non trouvé sur aucune API pour ISBN:', cleanISBN);
  }
  
  return book;
}

