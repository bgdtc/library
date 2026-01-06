import { Library } from '../types/library';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Types pour l'API File System Access
declare global {
  interface Window {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

const DB_NAME = 'LibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';

// Initialiser IndexedDB pour stocker le handle de fichier
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Sauvegarder le handle de fichier dans IndexedDB
async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(handle, 'libraryFile');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Impossible de sauvegarder le handle de fichier:', error);
  }
}

// Récupérer le handle de fichier depuis IndexedDB
async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('libraryFile');
      request.onsuccess = () => {
        const handle = request.result;
        resolve(handle || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Impossible de récupérer le handle de fichier:', error);
    return null;
  }
}

// Vérifier si l'API File System Access est disponible
function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

// Sauvegarder la bibliothèque avec l'API File System Access
export async function saveLibrary(library: Library): Promise<void> {
  const jsonString = JSON.stringify(library, null, 2);
  
  // Essayer d'utiliser l'API File System Access si disponible
  if (isFileSystemAccessSupported()) {
    try {
      let fileHandle = await getFileHandle();
      
      // Si pas de handle existant, demander où sauvegarder
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker!({
          suggestedName: `${library.name || 'bibliotheque'}.json`,
          types: [{
            description: 'Fichier JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        
        // Sauvegarder le handle pour les prochaines fois
        await saveFileHandle(fileHandle);
      }
      
      // Écrire dans le fichier
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      
      return;
    } catch (error: any) {
      // Si l'utilisateur annule, ne rien faire
      if (error.name === 'AbortError') {
        return;
      }
      console.warn('Erreur avec File System Access, fallback vers téléchargement:', error);
    }
  }
  
  // Fallback : téléchargement classique
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${library.name || 'bibliotheque'}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function loadLibraryFromFile(file: File): Promise<Library> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const library: Library = JSON.parse(content);
        
        // Validation basique
        if (!library.books || !Array.isArray(library.books)) {
          throw new Error('Format de bibliothèque invalide');
        }
        
        resolve(library);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsText(file);
  });
}

// Charger automatiquement la bibliothèque depuis le fichier sauvegardé
export async function loadLibraryFromSavedFile(): Promise<Library | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }
  
  try {
    const fileHandle = await getFileHandle();
    if (!fileHandle) {
      return null;
    }
    
    // Essayer de lire le fichier directement
    // Si les permissions ne sont plus valides, cela échouera et on retournera null
    try {
      const file = await fileHandle.getFile();
      return await loadLibraryFromFile(file);
    } catch (error: any) {
      // Si l'erreur est liée aux permissions, on retourne null silencieusement
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        console.warn('Permissions de fichier expirées, veuillez réimporter');
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.warn('Impossible de charger depuis le fichier sauvegardé:', error);
    return null;
  }
}

// Réinitialiser le handle de fichier (pour changer d'emplacement)
export async function resetFileHandle(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete('libraryFile');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Impossible de réinitialiser le handle:', error);
  }
}

export async function loadLibraryFromS3(
  bucket: string,
  key: string,
  region: string = 'us-east-1',
  accessKeyId?: string,
  secretAccessKey?: string
): Promise<Library> {
  try {
    const s3Client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
    });
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    const bodyString = await response.Body?.transformToString();
    
    if (!bodyString) {
      throw new Error('Fichier vide ou inaccessible');
    }
    
    const library: Library = JSON.parse(bodyString);
    
    // Validation basique
    if (!library.books || !Array.isArray(library.books)) {
      throw new Error('Format de bibliothèque invalide');
    }
    
    return library;
  } catch (error) {
    console.error('Erreur lors du chargement depuis S3:', error);
    throw new Error('Impossible de charger la bibliothèque depuis S3');
  }
}

