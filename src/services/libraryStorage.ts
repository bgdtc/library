import { Library } from '../types/library';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export function saveLibrary(library: Library): void {
  const jsonString = JSON.stringify(library, null, 2);
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

