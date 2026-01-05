import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  IconButton,
} from '@mui/material';
import { ArrowBack, Check } from '@mui/icons-material';
import { BookScanner } from '../components/BookScanner';
import { BookCard } from '../components/BookCard';
import { Book } from '../types/library';
import { Library } from '../types/library';
import { saveLibrary } from '../services/libraryStorage';

export function CreateLibraryPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleBookScanned = (book: Book) => {
    // Vérifier si le livre n'existe pas déjà
    if (!books.find((b) => b.isbn === book.isbn)) {
      setBooks([...books, book]);
    }
  };

  const handleFinish = () => {
    if (books.length === 0) {
      alert('Veuillez ajouter au moins un livre avant de terminer.');
      return;
    }

    const library: Library = {
      id: `library-${Date.now()}`,
      name: `Ma Bibliothèque - ${new Date().toLocaleDateString('fr-FR')}`,
      createdAt: new Date().toISOString(),
      books,
    };

    // Sauvegarder dans localStorage
    localStorage.setItem('currentLibrary', JSON.stringify(library));
    
    // Télécharger le fichier JSON
    saveLibrary(library);

    navigate('/library');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            Créer une bibliothèque
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <BookScanner onBookScanned={handleBookScanned} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                position: 'sticky',
                top: 20,
                maxHeight: 'calc(100vh - 100px)',
                overflow: 'auto',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Livres ajoutés
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {books.length} livre{books.length > 1 ? 's' : ''}
                </Typography>
              </Stack>

              {books.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body1">
                    Aucun livre ajouté pour le moment
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Scannez ou entrez un ISBN pour commencer
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {books.map((book) => (
                    <Grid item xs={6} sm={4} key={book.isbn}>
                      <Box
                        onClick={() => setSelectedBook(book)}
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        <BookCard book={book} onClick={() => {}} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              {books.length > 0 && (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<Check />}
                  onClick={handleFinish}
                  sx={{ mt: 3 }}
                >
                  Terminer et sauvegarder
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

