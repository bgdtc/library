import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  CardMedia,
  IconButton,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Book } from '../types/library';

interface BookDialogProps {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onUpdate: (updatedBook: Book) => void;
}

export function BookDialog({ open, book, onClose, onUpdate }: BookDialogProps) {
  const [read, setRead] = useState(book?.read || false);
  const [readBy, setReadBy] = useState<string[]>(book?.readBy || []);
  const [newReader, setNewReader] = useState('');
  const [owner, setOwner] = useState(book?.owner || '');

  // Mettre à jour les états quand le livre change
  useEffect(() => {
    if (book) {
      setRead(book.read || false);
      setReadBy(book.readBy || []);
      setOwner(book.owner || '');
    }
  }, [book]);

  if (!book) return null;

  const handleToggleRead = () => {
    const newRead = !read;
    setRead(newRead);
    onUpdate({ ...book, read: newRead, readBy: newRead ? readBy : [] });
  };

  const handleAddReader = () => {
    if (newReader.trim() && !readBy.includes(newReader.trim())) {
      const updatedReaders = [...readBy, newReader.trim()];
      setReadBy(updatedReaders);
      setNewReader('');
      onUpdate({ ...book, readBy: updatedReaders });
    }
  };

  const handleRemoveReader = (reader: string) => {
    const updatedReaders = readBy.filter((r) => r !== reader);
    setReadBy(updatedReaders);
    onUpdate({ ...book, readBy: updatedReaders });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Détails du livre</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            {book.coverUrl && (
              <CardMedia
                component="img"
                image={book.coverUrl}
                alt={book.title}
                sx={{
                  width: { xs: '100%', sm: 150 },
                  height: { xs: 'auto', sm: 225 },
                  objectFit: 'cover',
                  borderRadius: 2,
                  maxWidth: { sm: 150 },
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                {book.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {book.authors.join(', ')}
              </Typography>
              {book.publishedYear && (
                <Typography variant="body2" color="text.secondary">
                  Année de publication : {book.publishedYear}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ISBN : {book.isbn}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Propriétaire
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Nom du propriétaire"
              value={owner}
              onChange={(e) => {
                const newOwner = e.target.value;
                setOwner(newOwner);
                onUpdate({ ...book, owner: newOwner.trim() || undefined });
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch checked={read} onChange={handleToggleRead} color="primary" />
              }
              label="Marquer comme lu"
            />
          </Box>

          {read && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Qui a lu ce livre ?
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {readBy.map((reader) => (
                  <Chip
                    key={reader}
                    label={reader}
                    onDelete={() => handleRemoveReader(reader)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nom du lecteur"
                  value={newReader}
                  onChange={(e) => setNewReader(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddReader();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddReader}
                  disabled={!newReader.trim()}
                >
                  Ajouter
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

