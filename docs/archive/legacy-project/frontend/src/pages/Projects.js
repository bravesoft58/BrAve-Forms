import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  IconButton, 
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Alert,
  Pagination,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  FilterList as FilterIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectsAPI } from '../api/api';
import useAuthStore from '../store/authStore';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Validation schema for new project
const projectSchema = yup.object({
  name: yup.string().required('Project name is required'),
  description: yup.string(),
  location: yup.string(),
  startDate: yup.date(),
  endDate: yup.date().min(
    yup.ref('startDate'),
    'End date must be after start date'
  ),
});

const Projects = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'archived'
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const rowsPerPage = 6;
  
  // Form handling
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    }
  });

  // Fetch projects with filters and sorting
  const { data: projects, isLoading, error, refetch } = useQuery(
    ['projects', page, rowsPerPage, filterStatus, sortField, sortDirection],
    () => projectsAPI.getProjects({
      page,
      limit: rowsPerPage,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      sortBy: sortField,
      sortDirection,
    })
  );

  // Create project mutation
  const createProject = useMutation(projectsAPI.createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      setOpenDialog(false);
      reset();
    },
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
  };

  const onSubmit = (data) => {
    createProject.mutate(data);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setSortField('createdAt');
    setSortDirection('desc');
    setPage(1);
  };

  // Filter projects based on search term
  const filteredProjects = projects?.data?.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={`Error loading projects: ${error.message}`}
        retry={() => refetch()}
      />
    );
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />;
  };

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Projects
        </Typography>
        {(role === 'admin' || role === 'foreman') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Project
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          sx={{ flexGrow: 1 }}
          variant="outlined"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={filterStatus}
            onChange={handleFilterStatusChange}
            label="Status"
          >
            <MenuItem value="all">All Projects</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Sort Options">
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => setOpenFilterDialog(true)}
            size="small"
          >
            Sort
          </Button>
        </Tooltip>

        {(searchTerm || filterStatus !== 'all' || sortField !== 'createdAt' || sortDirection !== 'desc') && (
          <Tooltip title="Clear Filters">
            <IconButton onClick={handleClearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {filteredProjects?.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">
            No projects found. {role === 'admin' || role === 'foreman' ? 'Create a new project to get started.' : ''}
          </Typography>
          {(role === 'admin' || role === 'foreman') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ mt: 2 }}
            >
              Create New Project
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredProjects?.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                  opacity: project.archived ? 0.7 : 1,
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" className="text-ellipsis">
                        {project.name}
                      </Typography>
                      {project.archived && (
                        <Chip label="Archived" size="small" color="default" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}
                    </Typography>
                    
                    {project.location && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Location:</strong> {project.location}
                      </Typography>
                    )}
                    
                    {project.startDate && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Start Date:</strong> {format(new Date(project.startDate), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created by: {project.createdBy?.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created: {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/projects/${project._id}`)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {projects?.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={projects.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* New Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Project Name"
              name="name"
              autoFocus
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={4}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              {...register('location')}
              error={!!errors.location}
              helperText={errors.location?.message}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="startDate"
                  label="Start Date"
                  name="startDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('startDate')}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="endDate"
                  label="Estimated End Date"
                  name="endDate"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('endDate')}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createProject.isLoading}>
              {createProject.isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Sort Options</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Sort by:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button 
              variant={sortField === 'name' ? 'contained' : 'outlined'}
              onClick={() => handleSortChange('name')}
              endIcon={getSortIcon('name')}
              size="small"
            >
              Project Name
            </Button>
            <Button 
              variant={sortField === 'createdAt' ? 'contained' : 'outlined'}
              onClick={() => handleSortChange('createdAt')}
              endIcon={getSortIcon('createdAt')}
              size="small"
            >
              Creation Date
            </Button>
            <Button 
              variant={sortField === 'startDate' ? 'contained' : 'outlined'}
              onClick={() => handleSortChange('startDate')}
              endIcon={getSortIcon('startDate')}
              size="small"
            >
              Start Date
            </Button>
            <Button 
              variant={sortField === 'endDate' ? 'contained' : 'outlined'}
              onClick={() => handleSortChange('endDate')}
              endIcon={getSortIcon('endDate')}
              size="small"
            >
              End Date
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilterDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;