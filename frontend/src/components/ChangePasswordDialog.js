import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from 'react-query';
import { authAPI } from '../api/api';

// Validation schema
const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup.string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

const ChangePasswordDialog = ({ open, onClose }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form handling
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Change password mutation
  const changePassword = useMutation(authAPI.changePassword, {
    onSuccess: () => {
      setSuccess(true);
      setError('');
      // Reset form after 2 seconds and close dialog
      setTimeout(() => {
        reset();
        setSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    },
  });

  const onSubmit = (data) => {
    setError('');
    const { confirmPassword, ...passwordData } = data;
    changePassword.mutate(passwordData);
  };

  const handleClose = () => {
    if (!changePassword.isLoading) {
      reset();
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Password changed successfully!</Alert>}

          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                label="Current Password"
                type="password"
                autoComplete="current-password"
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                label="New Password"
                type="password"
                autoComplete="new-password"
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                label="Confirm New Password"
                type="password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={changePassword.isLoading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={changePassword.isLoading}
          >
            {changePassword.isLoading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ChangePasswordDialog;