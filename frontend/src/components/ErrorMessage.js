import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

const ErrorMessage = ({ message, retry, back }) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body1">{message || 'An error occurred'}</Typography>
      </Alert>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {retry && (
          <Button variant="contained" color="primary" onClick={retry}>
            Retry
          </Button>
        )}
        {back && (
          <Button variant="outlined" onClick={back}>
            Go Back
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ErrorMessage;