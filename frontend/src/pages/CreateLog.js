import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, CircularProgress, Paper, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Grid, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectsAPI, logsAPI } from '../api/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register FilePond plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

// Validation schema
const logSchema = yup.object({
  date: yup.date().required('Date is required'),
  content: yup.string().required('Content is required'),
  logType: yup.string().required('Log type is required'),
});

const CreateLog = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [error, setError] = useState('');
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery(['project', projectId], () => projectsAPI.getProject(projectId));
  
  // Form handling
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(logSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      content: '',
      logType: 'dust_control',
    },
  });

  // Create log mutation
  const createLog = useMutation(logsAPI.createLog, {
    onSuccess: () => {
      queryClient.invalidateQueries(['logs', projectId]);
      navigate(`/projects/${projectId}`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to create log');
    },
  });

  // Upload photo mutation
  const uploadPhoto = useMutation(logsAPI.uploadPhoto, {
    onSuccess: (data) => {
      setUploadedPhotos([...uploadedPhotos, data.data.photoUrl]);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to upload photo');
    },
  });

  const onSubmit = (data) => {
    const logData = {
      ...data,
      projectId,
      photos: uploadedPhotos,
    };
    createLog.mutate(logData);
  };

  const handleCancel = () => {
    navigate(`/projects/${projectId}`);
  };

  // Handle file upload
  const handleFileUpload = (fileItems) => {
    setFiles(fileItems);
    
    // If a new file was added, upload it
    if (fileItems.length > 0 && fileItems[fileItems.length - 1].file) {
      const formData = new FormData();
      formData.append('photo', fileItems[fileItems.length - 1].file);
      formData.append('projectId', projectId);
      
      uploadPhoto.mutate(formData);
    }
  };

  if (projectLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Log
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="date"
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="logType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" error={!!errors.logType}>
                    <InputLabel id="log-type-label">Log Type</InputLabel>
                    <Select
                      {...field}
                      labelId="log-type-label"
                      id="logType"
                      label="Log Type"
                    >
                      <MenuItem value="dust_control">Dust Control</MenuItem>
                      <MenuItem value="swppp">SWPPP</MenuItem>
                      <MenuItem value="safety">Safety</MenuItem>
                      <MenuItem value="daily">Daily Log</MenuItem>
                    </Select>
                    {errors.logType && <FormHelperText>{errors.logType.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="content"
                    label="Log Content"
                    multiline
                    rows={6}
                    error={!!errors.content}
                    helperText={errors.content?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Photos
              </Typography>
              <FilePond
                files={files}
                onupdatefiles={handleFileUpload}
                allowMultiple={true}
                maxFiles={5}
                name="photo"
                labelIdle='Drag & Drop your photos or <span class="filepond--label-action">Browse</span>'
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createLog.isLoading}
            >
              {createLog.isLoading ? 'Creating...' : 'Create Log'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateLog;