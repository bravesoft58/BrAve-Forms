import React, { useState } from 'react';
import { Box, ImageList, ImageListItem, Dialog, IconButton, Typography } from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

const PhotoGallery = ({ photos }) => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No photos available
      </Typography>
    );
  }

  const handleOpen = (index) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  return (
    <Box>
      <ImageList sx={{ width: '100%' }} cols={3} rowHeight={200}>
        {photos.map((photo, index) => (
          <ImageListItem 
            key={index} 
            onClick={() => handleOpen(index)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.3s'
            }}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              loading="lazy"
              style={{ height: '100%', objectFit: 'cover' }}
            />
          </ImageListItem>
        ))}
      </ImageList>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: 'relative', bgcolor: 'black', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
          
          <IconButton
            onClick={handlePrev}
            sx={{ position: 'absolute', left: 8, color: 'white' }}
          >
            <ArrowBack />
          </IconButton>
          
          <img
            src={photos[currentIndex]}
            alt={`Full size ${currentIndex + 1}`}
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
          
          <IconButton
            onClick={handleNext}
            sx={{ position: 'absolute', right: 8, color: 'white' }}
          >
            <ArrowForward />
          </IconButton>
          
          <Typography 
            variant="body2" 
            sx={{ position: 'absolute', bottom: 16, color: 'white' }}
          >
            {currentIndex + 1} / {photos.length}
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PhotoGallery;