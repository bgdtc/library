import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Stack,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { CloudUpload, CloudDownload } from '@mui/icons-material';
import { useState, useRef } from 'react';
import { Library } from '../types/library';
import { loadLibraryFromFile, loadLibraryFromS3 } from '../services/libraryStorage';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (library: Library) => void;
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [tab, setTab] = useState(0);
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Key, setS3Key] = useState('');
  const [s3Region, setS3Region] = useState('us-east-1');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const library = await loadLibraryFromFile(file);
      onImport(library);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleS3Import = async () => {
    if (!s3Bucket || !s3Key) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const library = await loadLibraryFromS3(
        s3Bucket,
        s3Key,
        s3Region,
        s3AccessKey || undefined,
        s3SecretKey || undefined
      );
      onImport(library);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import depuis S3');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setS3Bucket('');
    setS3Key('');
    setS3Region('us-east-1');
    setS3AccessKey('');
    setS3SecretKey('');
    setError(null);
    setTab(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Importer une bibliothèque</Typography>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Fichier JSON" icon={<CloudUpload />} iconPosition="start" />
          <Tab label="Amazon S3" icon={<CloudDownload />} iconPosition="start" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tab === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Sélectionnez un fichier JSON de bibliothèque à importer
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              disabled={loading}
            >
              Choisir un fichier
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Importez votre bibliothèque depuis Amazon S3
            </Typography>
            <TextField
              fullWidth
              label="Bucket S3"
              value={s3Bucket}
              onChange={(e) => setS3Bucket(e.target.value)}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Clé (Key)"
              value={s3Key}
              onChange={(e) => setS3Key(e.target.value)}
              required
              disabled={loading}
              placeholder="bibliotheque.json"
            />
            <TextField
              fullWidth
              label="Région"
              value={s3Region}
              onChange={(e) => setS3Region(e.target.value)}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Access Key ID (optionnel)"
              value={s3AccessKey}
              onChange={(e) => setS3AccessKey(e.target.value)}
              type="password"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Secret Access Key (optionnel)"
              value={s3SecretKey}
              onChange={(e) => setS3SecretKey(e.target.value)}
              type="password"
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleS3Import}
              disabled={loading || !s3Bucket || !s3Key}
              fullWidth
            >
              {loading ? 'Import en cours...' : 'Importer depuis S3'}
            </Button>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
}

