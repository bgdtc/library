import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material';
import { LibraryBooks, CloudUpload } from '@mui/icons-material';
import { ImportDialog } from '../components/ImportDialog';
import { Library } from '../types/library';
import { loadLibraryFromSavedFile } from '../services/libraryStorage';

export function HomePage() {
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Essayer de charger automatiquement la bibliothèque depuis le fichier sauvegardé
    const loadSavedLibrary = async () => {
      try {
        const library = await loadLibraryFromSavedFile();
        if (library) {
          // Stocker dans localStorage et rediriger
          localStorage.setItem('currentLibrary', JSON.stringify(library));
          navigate('/library');
        }
      } catch (error) {
        console.warn('Impossible de charger la bibliothèque sauvegardée:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedLibrary();
  }, [navigate]);

  const handleImport = (library: Library) => {
    // Stocker la bibliothèque dans le localStorage pour la page LibraryPage
    localStorage.setItem('currentLibrary', JSON.stringify(library));
    navigate('/library');
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            mb: 2,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ma Bibliothèque
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 6, textAlign: 'center', maxWidth: 500 }}
        >
          Gérez votre collection de livres numériquement. Scannez, organisez et suivez vos lectures.
        </Typography>

        <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <LibraryBooks sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Créer une bibliothèque
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Commencez une nouvelle bibliothèque et ajoutez vos livres en les scannant
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate('/create')}
                sx={{ mt: 2 }}
              >
                Créer
              </Button>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <CloudUpload sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Importer une bibliothèque
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Importez une bibliothèque existante depuis un fichier JSON ou Amazon S3
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                onClick={() => setImportDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Importer
              </Button>
            </Stack>
          </Paper>
        </Stack>

        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImport}
        />
      </Box>
    </Container>
  );
}

