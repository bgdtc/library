import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function useBookScanner(onScanSuccess: (isbn: string) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'isbn-scanner';

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Erreur lors de l\'arrêt du scanner:', err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Marquer comme scanning d'abord pour rendre l'élément visible
      setIsScanning(true);
      
      // Attendre que l'élément soit rendu et visible dans le DOM
      let element: HTMLElement | null = null;
      let attempts = 0;
      while (!element && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        element = document.getElementById(scannerId);
        attempts++;
      }
      
      if (!element) {
        setIsScanning(false);
        throw new Error('Élément du scanner introuvable. Veuillez réessayer.');
      }
      
      // Vérifier que l'élément est visible
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        setIsScanning(false);
        throw new Error('L\'élément du scanner n\'est pas visible.');
      }

      // Nettoyer le scanner précédent s'il existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      // Essayer d'abord avec la caméra arrière (environment)
      let cameraId: string | { facingMode: string } = { facingMode: 'environment' };
      
      // Essayer de lister les caméras pour trouver la meilleure
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Préférer la caméra arrière si disponible
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          cameraId = backCamera?.id || devices[0].id;
        }
      } catch (e) {
        // Si on ne peut pas lister les caméras, utiliser facingMode
        console.warn('Impossible de lister les caméras, utilisation de facingMode');
      }

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          console.log('Texte scanné:', decodedText);
          // Vérifier si c'est un ISBN (10 ou 13 chiffres, avec ou sans tirets)
          // Les codes-barres ISBN peuvent être scannés comme des nombres purs
          const cleanText = decodedText.replace(/[-\s]/g, '');
          const isbnMatch = cleanText.match(/^(?:ISBN)?(\d{10}|\d{13})$/i) || cleanText.match(/^(\d{10}|\d{13})$/);
          if (isbnMatch) {
            const isbn = isbnMatch[1] || cleanText;
            console.log('ISBN détecté:', isbn);
            onScanSuccess(isbn);
            stopScanning();
          }
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan continu (not found, etc.)
          // Ne pas afficher ces erreurs car elles sont normales pendant le scan
          // console.debug('Scan error (normal):', errorMessage);
        }
      );
      // setIsScanning est déjà à true depuis le début
    } catch (err) {
      console.error('Erreur scanner:', err);
      let errorMessage = 'Erreur lors du démarrage du scanner';
      
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          errorMessage = 'Permission de caméra refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.';
        } else if (err.message.includes('NotFoundError') || err.message.includes('No camera found')) {
          errorMessage = 'Aucune caméra trouvée. Veuillez connecter une caméra.';
        } else if (err.message.includes('NotReadableError')) {
          errorMessage = 'La caméra est déjà utilisée par une autre application.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsScanning(false);
      
      // Nettoyer en cas d'erreur
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          // Ignorer
        }
        scannerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    scannerId,
  };
}

