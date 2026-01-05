import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { CameraAlt, Keyboard } from '@mui/icons-material';
import { useBookScanner } from '../hooks/useBookScanner';
import { fetchBookByISBN } from '../services/openLibraryApi';
import { Book } from '../types/library';

interface BookScannerProps {
  onBookScanned: (book: Book) => void;
}

export function BookScanner({ onBookScanned }: BookScannerProps) {
  const [manualISBN, setManualISBN] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanSuccess = async (isbn: string) => {
    setIsLoading(true);
    setScanError(null);
    
    try {
      const book = await fetchBookByISBN(isbn);
      if (book) {
        onBookScanned(book);
        setManualISBN('');
      } else {
        setScanError('Livre non trouvé. Vérifiez que l\'ISBN est correct.');
      }
    } catch (error) {
      setScanError('Erreur lors de la récupération des informations du livre.');
    } finally {
      setIsLoading(false);
    }
  };

  const {
    isScanning,
    error: scannerError,
    startScanning,
    stopScanning,
    scannerId,
  } = useBookScanner(handleScanSuccess);

  // Ajouter des styles globaux pour la vidéo du scanner
  useEffect(() => {
    if (isScanning) {
      const style = document.createElement('style');
      style.textContent = `
        #${scannerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        #${scannerId} canvas {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isScanning, scannerId]);

  const handleManualSubmit = async () => {
    if (!manualISBN.trim()) {
      setScanError('Veuillez entrer un ISBN');
      return;
    }

    await handleScanSuccess(manualISBN.trim());
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Scanner un livre
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Utilisez votre caméra pour scanner le code-barres ISBN du livre
          </Typography>

          <Box
            component="div"
            id={scannerId}
            sx={{
              width: '100%',
              maxWidth: 400,
              minHeight: isScanning ? 400 : 0,
              height: isScanning ? 400 : 0,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black',
              position: 'relative',
              display: isScanning ? 'block' : 'none',
              '& video': {
                width: '100% !important',
                height: '100% !important',
                objectFit: 'cover',
                display: 'block !important',
                backgroundColor: 'transparent',
              },
              '& canvas': {
                display: 'none !important',
              },
              '& #qr-shaded-region': {
                border: '2px solid rgba(0, 122, 255, 0.5) !important',
                borderRadius: '8px',
              },
            }}
          />
          {!isScanning ? (
            <Button
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={startScanning}
              fullWidth
              size="large"
              disabled={isLoading}
            >
              Démarrer le scan
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={stopScanning}
              fullWidth
              size="large"
            >
              Arrêter le scan
            </Button>
          )}

          {(scannerError || scanError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {scannerError || scanError}
            </Alert>
          )}
        </Paper>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '&::before, &::after': {
              content: '""',
              flex: 1,
              height: '1px',
              bgcolor: 'divider',
            },
          }}
        >
          <Typography variant="body2" color="text.secondary">
            OU
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Saisie manuelle
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Entrez l'ISBN du livre manuellement
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="ISBN"
              value={manualISBN}
              onChange={(e) => setManualISBN(e.target.value)}
              placeholder="978-2-07-036822-8"
              disabled={isLoading || isScanning}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Keyboard />}
              onClick={handleManualSubmit}
              disabled={isLoading || isScanning || !manualISBN.trim()}
              sx={{ minWidth: 120 }}
            >
              Ajouter
            </Button>
          </Stack>
        </Paper>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </Stack>
    </Box>
  );
}

