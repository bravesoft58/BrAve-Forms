import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, TextField, Button, Grid, Link, Paper, Alert, CircularProgress } from '@mui/material';
import { useMutation } from 'react-query';
import { authAPI } from '../api/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useAuthStore from '../store/authStore';

// Validation schema
const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

// MFA validation schema
const mfaSchema = yup.object({
  mfaCode: yup.string().required('MFA code is required').length(6, 'MFA code must be 6 digits'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Login form handling
  const { control: loginControl, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // MFA form handling
  const { control: mfaControl, handleSubmit: handleMfaSubmit, formState: { errors: mfaErrors } } = useForm({
    resolver: yupResolver(mfaSchema),
    defaultValues: {
      mfaCode: '',
    },
  });
  
  // Login mutation
  const loginMutation = useMutation(({ email, password }) => authAPI.login(email, password), {
    onSuccess: (response) => {
      const { requiresMfa, userId, token, role } = response.data;
      
      if (requiresMfa) {
        setUserId(userId);
        setShowMfa(true);
      } else {
        login(token, userId, role);
        navigate('/');
      }
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    },
  });
  
  // Verify MFA mutation
  const verifyMfaMutation = useMutation(({ userId, mfaCode }) => authAPI.verifyMfa(userId, mfaCode), {
    onSuccess: (response) => {
      const { token, userId, role } = response.data;
      login(token, userId, role);
      navigate('/');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Invalid MFA code. Please try again.');
    },
  });
  
  const onLoginSubmit = (data) => {
    setError('');
    loginMutation.mutate(data);
  };
  
  const onMfaSubmit = (data) => {
    setError('');
    verifyMfaMutation.mutate({ userId, mfaCode: data.mfaCode });
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {showMfa ? 'Enter MFA Code' : 'Sign In'}
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {!showMfa ? (
            <Box component="form" onSubmit={handleLoginSubmit(onLoginSubmit)} noValidate>
              <Controller
                name="email"
                control={loginControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    error={!!loginErrors.email}
                    helperText={loginErrors.email?.message}
                  />
                )}
              />
              
              <Controller
                name="password"
                control={loginControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    error={!!loginErrors.password}
                    helperText={loginErrors.password?.message}
                  />
                )}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loginMutation.isLoading}
              >
                {loginMutation.isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <Grid container>
                <Grid item xs>
                  <Link component={RouterLink} to="/forgot-password" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link component={RouterLink} to="/register" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleMfaSubmit(onMfaSubmit)} noValidate>
              <Typography variant="body2" sx={{ mb: 2 }}>
                A verification code has been sent to your email. Please enter the 6-digit code below.
              </Typography>
              
              <Controller
                name="mfaCode"
                control={mfaControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="mfaCode"
                    label="MFA Code"
                    autoFocus
                    error={!!mfaErrors.mfaCode}
                    helperText={mfaErrors.mfaCode?.message}
                  />
                )}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={verifyMfaMutation.isLoading}
              >
                {verifyMfaMutation.isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Verify'
                )}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowMfa(false)}
              >
                Back to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;