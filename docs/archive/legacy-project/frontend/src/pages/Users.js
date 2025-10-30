import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  Tooltip,
  Container,
  TablePagination,
  FormHelperText,
  Grid,
  LoadingButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI } from '../api/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Validation schema for user form
const userSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().required('Role is required'),
  password: yup.string()
    .when('isEditing', {
      is: false,
      then: yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
      otherwise: yup.string()
    }),
  phone: yup.string(),
});

const Users = () => {
  const queryClient = useQueryClient();
  const { role: currentUserRole } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', userId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rowsPerPage = 10;

  // Fetch users
  const { data: users, isLoading, error: fetchError, refetch } = useQuery(
    ['users', page, rowsPerPage],
    () => userAPI.getUsers({ page, limit: rowsPerPage })
  );

  // Form handling
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'inspector',
      password: '',
      phone: '',
      isEditing: false,
    },
  });

  // Mutations
  const createUser = useMutation(userAPI.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setOpenDialog(false);
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(''), 3000);
      reset();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to create user');
    },
  });

  const updateUser = useMutation(({ id, userData }) => userAPI.updateUser(id, userData), {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setOpenDialog(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      reset();
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteUser = useMutation(userAPI.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to delete user');
    },
  });

  const toggleUserStatus = useMutation(({ id, status }) => userAPI.updateUserStatus(id, { active: status }), {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setSuccess('User status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update user status');
    },
  });

  const resetUserPassword = useMutation(userAPI.resetUserPassword, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setSuccess('Password reset email sent successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to reset password');
    },
  });

  // Early return for non-admin users
  if (currentUserRole !== 'admin') {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Box>
    );
  }

  // Handlers
  const handleOpenDialog = (user = null) => {
    if (user) {
      setIsEditing(true);
      setSelectedUser(user);
      Object.keys(user).forEach((key) => {
        if (key !== 'password') {
          setValue(key, user[key]);
        }
      });
    } else {
      setIsEditing(false);
      setSelectedUser(null);
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setSelectedUser(null);
    reset();
    setError('');
  };

  const onSubmit = (data) => {
    if (isEditing && selectedUser) {
      const { password, ...updateData } = data;
      if (!password) delete updateData.password;
      updateUser.mutate({ id: selectedUser._id, userData: updateData });
    } else {
      createUser.mutate(data);
    }
  };

  const handleDeleteUser = (userId) => {
    setConfirmAction({ type: 'delete', userId });
    setOpenConfirmDialog(true);
  };

  const handleToggleStatus = (userId, currentStatus) => {
    setConfirmAction({ type: 'status', userId, newStatus: !currentStatus });
    setOpenConfirmDialog(true);
  };

  const handleResetPassword = (userId) => {
    setConfirmAction({ type: 'reset', userId });
    setOpenConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    const { type, userId, newStatus } = confirmAction;
    
    switch (type) {
      case 'delete':
        deleteUser.mutate(userId);
        break;
      case 'status':
        toggleUserStatus.mutate({ id: userId, status: newStatus });
        break;
      case 'reset':
        resetUserPassword.mutate(userId);
        break;
      default:
        break;
    }
    
    setOpenConfirmDialog(false);
    setConfirmAction({ type: '', userId: '' });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Filter and sort users
  const filteredUsers = users?.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower)
    );
  }) || [];

  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (fetchError) {
    return (
      <ErrorMessage
        message={`Error loading users: ${fetchError.message}`}
        retry={() => refetch()}
      />
    );
  }

  // Helper function to get confirmation dialog props
  const getConfirmDialogProps = () => {
    const { type } = confirmAction;
    switch (type) {
      case 'delete':
        return {
          title: 'Delete User',
          message: 'Are you sure you want to delete this user? This action cannot be undone.',
          confirmText: 'Delete',
          severity: 'error',
        };
      case 'status':
        return {
          title: 'Change User Status',
          message: 'Are you sure you want to change the status of this user?',
          confirmText: 'Confirm',
          severity: 'warning',
        };
      case 'reset':
        return {
          title: 'Reset Password',
          message: 'Are you sure you want to reset this user\'s password? They will receive an email with instructions.',
          confirmText: 'Reset Password',
          severity: 'primary',
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          severity: 'primary',
        };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Users Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ p: 2 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? 'Active' : 'Inactive'}
                      color={user.active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(user)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleResetPassword(user._id)}
                      sx={{ mr: 1 }}
                    >
                      <LockResetIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={user.active ? 'warning' : 'success'}
                      onClick={() => handleToggleStatus(user._id, user.active)}
                      sx={{ mr: 1 }}
                    >
                      {user.active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page - 1}
          onPageChange={(e, newPage) => handlePageChange(e, newPage + 1)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                {...register('name')}
                margin="normal"
                required
                fullWidth
                label="Full Name"
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              
              <TextField
                {...register('email')}
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <FormControl fullWidth margin="normal" error={!!errors.role}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  {...register('role')}
                  labelId="role-label"
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="inspector">Inspector</MenuItem>
                </Select>
              </FormControl>

              {!isEditing && (
                <TextField
                  {...register('password')}
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}

              <TextField
                {...register('phone')}
                margin="normal"
                fullWidth
                label="Phone Number (Optional)"
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createUser.isLoading || updateUser.isLoading}
            >
              {isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={openConfirmDialog}
        onCancel={() => setOpenConfirmDialog(false)}
        onConfirm={handleConfirmAction}
        {...getConfirmDialogProps()}
      />
    </Container>
  );
};

export default Users;