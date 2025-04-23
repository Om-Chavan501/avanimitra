// File: frontend/src/pages/NotFound.jsx
import React from 'react';
import { Grid, Typography } from '@mui/material';

const NotFound = () => {
  return (
    <Grid container justifyContent="center" sx={{ mt: 10 }}>
      <Grid item xs={12} md={6}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Oops, it looks like you're lost!
        </Typography>
        <Typography variant="body1">
          The page you're looking for doesn't exist. Please check the URL or go back to the homepage.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default NotFound;