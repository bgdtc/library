import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { Book as BookType } from '../types/library';
import { CheckCircle, Person } from '@mui/icons-material';

interface BookCardProps {
  book: BookType;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative', pt: '150%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          image={
            book.coverUrl ||
            'https://via.placeholder.com/300x450?text=No+Cover'
          }
          alt={book.title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 0.5,
          }}
        >
          {book.owner && (
            <Chip
              icon={<Person />}
              label={book.owner}
              color="primary"
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
          {book.read && (
            <Chip
              icon={<CheckCircle />}
              label="Lu"
              color="success"
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '3em',
          }}
        >
          {book.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.authors.join(', ')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
          {book.publishedYear && (
            <Typography variant="caption" color="text.secondary">
              {book.publishedYear}
            </Typography>
          )}
          {book.owner && (
            <>
              {book.publishedYear && (
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
              )}
              <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person sx={{ fontSize: '0.75rem' }} />
                {book.owner}
              </Typography>
            </>
          )}
        </Stack>
        {book.readBy && book.readBy.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
            {book.readBy.map((reader, index) => (
              <Chip
                key={index}
                label={reader}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

