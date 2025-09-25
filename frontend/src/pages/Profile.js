import React, { useState } from 'react';
import { Typography, Box, Paper, TextField, Button, Grid, CircularProgress, Alert, Avatar, Divider, Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../api/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useAuthStore from '../store/authStore';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Validation schema
const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
});

const Profile = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { role } = useAuthStore();
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openMfaDialog, setOpenMfaDialog] = useState(false);
  
  // Fetch user profile
  const { data: profile, isLoading, error: fetchError, refetch } = useQuery('profile', authAPI.getProfile);
  
  // Form handling
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });
  
  // Update profile mutation
  const updateProfile = useMutation(
    (userData) => authAPI.updateProfile(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (err) => {
        setError(err.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  // MFA mutations
  const enableMfa = useMutation(authAPI.enableMfa, {
    onSuccess: () => {
      queryClient.invalidateQueries('profile');
      setSuccess('Two-factor authentication enabled successfully');
      setTimeout(() => setSuccess(''), 3000);
      setOpenMfaDialog(false);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to enable two-factor authentication');
    },
  });

  const disableMfa = useMutation(authAPI.disableMfa, {
    onSuccess: () => {
      queryClient.invalidateQueries('profile');
      setSuccess('Two-factor authentication disabled successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to disable two-factor authentication');
    },
  });
  
  // Set form values when profile data is loaded
  React.useEffect(() => {
    if (profile?.data) {
      reset({
        name: profile.data.name || '',
        email: profile.data.email || '',
        phone: profile.data.phone || '',
      });
    }
  }, [profile, reset]);
  
  const onSubmit = (data) => {
    updateProfile.mutate(data);
  };

  const handleToggleMfa = () => {
    if (profile?.data?.mfaEnabled) {
      disableMfa.mutate();
    } else {
      setOpenMfaDialog(true);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (fetchError) {
    return (
      <ErrorMessage 
        message={`Error loading profile: ${fetchError.message}`}
        retry={() => refetch()}
      />
    );
  }
  
  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2, 
                fontSize: '3rem',
                bgcolor: 'primary.main',
                boxShadow: 2
              }}
            >
              {profile?.data?.name?.charAt(0) || profile?.data?.email?.charAt(0)}
            </Avatar>
            <Typography variant="h6">{profile?.data?.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{role}</Typography>
            <Chip 
              label={profile?.data?.mfaEnabled ? "2FA Enabled" : "2FA Disabled"} 
              color={profile?.data?.mfaEnabled ? "success" : "default"}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Name"
                    autoComplete="name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
              
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    autoComplete="tel"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={updateProfile.isLoading}
                >
                  {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Security
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Password</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              It's a good idea to use a strong password that you don't use elsewhere.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenChangePassword(true)}
            >
              Change Password
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Two-Factor Authentication</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add an extra layer of security to your account by requiring a verification code.
            </Typography>
            <Button
              variant="outlined"
              color={profile?.data?.mfaEnabled ? "error" : "secondary"}
              onClick={handleToggleMfa}
              disabled={enableMfa.isLoading || disableMfa.isLoading}
            >
              {enableMfa.isLoading || disableMfa.isLoading ? (
                <CircularProgress size={24} />
              ) : profile?.data?.mfaEnabled ? (
                'Disable Two-Factor Authentication'
              ) : (
                'Enable Two-Factor Authentication'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={openChangePassword} 
        onClose={() => setOpenChangePassword(false)} 
      />
    </Box>
  );
};

export default Profile;