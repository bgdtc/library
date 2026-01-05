import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  CloudUpload,
  ViewModule,
  ViewList,
  FilterList,
  Person,
} from '@mui/icons-material';
import { BookCard } from '../components/BookCard';
import { BookDialog } from '../components/BookDialog';
import { ImportDialog } from '../components/ImportDialog';
import { Book, Library } from '../types/library';
import { saveLibrary } from '../services/libraryStorage';

type ViewMode = 'grid' | 'list';

export function LibraryPage() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<Library | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [ownerMenuAnchor, setOwnerMenuAnchor] = useState<null | HTMLElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Extraire tous les propriétaires uniques
  const uniqueOwners = Array.from(
    new Set(books.filter(book => book.owner).map(book => book.owner!))
  ).sort();

  useEffect(() => {
    const storedLibrary = localStorage.getItem('currentLibrary');
    if (storedLibrary) {
      try {
        const lib: Library = JSON.parse(storedLibrary);
        setLibrary(lib);
        setBooks(lib.books);
      } catch (error) {
        console.error('Erreur lors du chargement de la bibliothèque:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    let filtered = [...books];

    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.authors.some((author) => author.toLowerCase().includes(query)) ||
          book.isbn.includes(query) ||
          (book.owner && book.owner.toLowerCase().includes(query))
      );
    }

    // Filtre lu/non lu
    if (filterRead === 'read') {
      filtered = filtered.filter((book) => book.read);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter((book) => !book.read);
    }

    // Filtre par propriétaire
    if (filterOwner !== 'all') {
      filtered = filtered.filter((book) => book.owner === filterOwner);
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, filterRead, filterOwner]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setDialogOpen(true);
  };

  const handleBookUpdate = (updatedBook: Book) => {
    const updatedBooks = books.map((b) =>
      b.isbn === updatedBook.isbn ? updatedBook : b
    );
    setBooks(updatedBooks);

    if (library) {
      const updatedLibrary: Library = {
        ...library,
        books: updatedBooks,
      };
      setLibrary(updatedLibrary);
      localStorage.setItem('currentLibrary', JSON.stringify(updatedLibrary));
    }
  };

  const handleSave = () => {
    if (library) {
      saveLibrary(library);
    }
  };

  const handleImport = (importedLibrary: Library) => {
    setLibrary(importedLibrary);
    setBooks(importedLibrary.books);
    localStorage.setItem('currentLibrary', JSON.stringify(importedLibrary));
  };

  if (!library) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={600} sx={{ flex: 1 }}>
            {library.name}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Importer
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Rechercher un livre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant={filterRead !== 'all' ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            >
              {filterRead === 'all'
                ? 'Tous'
                : filterRead === 'read'
                ? 'Lus'
                : 'Non lus'}
            </Button>
            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setFilterRead('all');
                  setFilterMenuAnchor(null);
                }}
              >
                Tous
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setFilterRead('read');
                  setFilterMenuAnchor(null);
                }}
              >
                Lus uniquement
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setFilterRead('unread');
                  setFilterMenuAnchor(null);
                }}
              >
                Non lus uniquement
              </MenuItem>
            </Menu>
            {uniqueOwners.length > 0 && (
              <>
                <Button
                  variant={filterOwner !== 'all' ? 'contained' : 'outlined'}
                  startIcon={<Person />}
                  onClick={(e) => setOwnerMenuAnchor(e.currentTarget)}
                >
                  {filterOwner === 'all' ? 'Propriétaire' : filterOwner}
                </Button>
                <Menu
                  anchorEl={ownerMenuAnchor}
                  open={Boolean(ownerMenuAnchor)}
                  onClose={() => setOwnerMenuAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setFilterOwner('all');
                      setOwnerMenuAnchor(null);
                    }}
                  >
                    Tous les propriétaires
                  </MenuItem>
                  {uniqueOwners.map((owner) => (
                    <MenuItem
                      key={owner}
                      onClick={() => {
                        setFilterOwner(owner);
                        setOwnerMenuAnchor(null);
                      }}
                    >
                      {owner}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="grid">
                <ViewModule />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''} affiché
            {filteredBooks.length !== books.length
              ? ` sur ${books.length}`
              : ''}
          </Typography>
        </Box>

        {filteredBooks.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun livre trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || filterRead !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Votre bibliothèque est vide'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredBooks.map((book) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={2}
                key={book.isbn}
              >
                <BookCard book={book} onClick={() => handleBookClick(book)} />
              </Grid>
            ))}
          </Grid>
        )}

        <BookDialog
          open={dialogOpen}
          book={selectedBook}
          onClose={() => {
            setDialogOpen(false);
            setSelectedBook(null);
          }}
          onUpdate={handleBookUpdate}
        />

        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImport}
        />
      </Box>
    </Container>
  );
}

