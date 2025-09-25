import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, CircularProgress } from '@mui/material';
import { RoleDashboard } from '../components/RoleDashboard';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1">
          Here's an overview of your jobsite logs and activities.
        </Typography>
      </Paper>
      
      <RoleDashboard />
    </Box>
  );
};

export default Dashboard;