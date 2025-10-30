import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, CircularProgress, Paper, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Grid, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { logsAPI } from '../api/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import PhotoGallery from '../components/PhotoGallery';

// Register FilePond plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

// Validation schema
const logSchema = yup.object({
  content: yup.string().required('Content is required'),
});

const LogDetail = () => {
  const { id: logId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch log details
  const { data: log, isLoading, error: fetchError } = useQuery(['log', logId], () => logsAPI.getLog(logId));
  
  // Form handling
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(logSchema),
    defaultValues: {
      content: '',
      logType: 'dust_control',
    },
  });

  // Update log mutation
  const updateLog = useMutation(({ id, data }) => logsAPI.updateLog(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['log', logId]);
      setIsEditing(false);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update log');
    },
  });

  // Upload photo mutation
  const uploadPhoto = useMutation(logsAPI.uploadPhoto, {
    onSuccess: () => {
      queryClient.invalidateQueries(['log', logId]);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to upload photo');
    },
  });

  // Set form values when log data is loaded
  React.useEffect(() => {
    if (log?.data) {
      reset({
        content: log.data.content,
        logType: log.data.logType,
      });
    }
  }, [log, reset]);

  const onSubmit = (data) => {
    updateLog.mutate({
      id: logId,
      data: {
        content: data.content,
        logType: data.logType,
      },
    });
  };

  const handleBack = () => {
    navigate(`/projects/${log?.data?.projectId?._id}`);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      content: log?.data?.content,
      logType: log?.data?.logType,
    });
  };

  // Handle file upload
  const handleFileUpload = (fileItems) => {
    setFiles(fileItems);
    
    // If a new file was added, upload it
    if (fileItems.length > 0 && fileItems[fileItems.length - 1].file) {
      const formData = new FormData();
      formData.append('photo', fileItems[fileItems.length - 1].file);
      formData.append('projectId', log?.data?.projectId?._id);
      formData.append('logId', logId);
      
      uploadPhoto.mutate(formData);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading log details..." />;
  }

  if (fetchError) {
    return (
      <ErrorMessage 
        message={`Error loading log: ${fetchError.message}`}
        back={handleBack}
      />
    );
  }

  const logData = log?.data;
  const canEdit = role === 'admin' || (role === 'foreman' && logData?.createdBy?._id === logData?.projectId?.createdBy);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Log Details
        </Typography>
        <Box>
          <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }}>
            Back to Project
          </Button>
          {canEdit && !isEditing && (
            <Button variant="contained" color="primary" onClick={handleEdit}>
              Edit Log
            </Button>
          )}
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Date
            </Typography>
            <Typography variant="body1">
              {format(new Date(logData?.date), 'MMMM dd, yyyy')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Log Type
            </Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {logData?.logType?.replace('_', ' ')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Created By
            </Typography>
            <Typography variant="body1">
              {logData?.createdBy?.email}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Project
            </Typography>
            <Typography variant="body1">
              {logData?.projectId?.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Content
            </Typography>
            {isEditing ? (
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      multiline
                      rows={6}
                      error={!!errors.content}
                      helperText={errors.content?.message}
                    />
                  )}
                />
                
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
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={handleCancel} sx={{ mr: 2 }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={updateLog.isLoading}
                  >
                    {updateLog.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {logData?.content}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Photos
            </Typography>
            {logData?.photos?.length > 0 ? (
              <PhotoGallery photos={logData.photos} />
            ) : (
              <Typography variant="body1">
                No photos attached to this log.
              </Typography>
            )}
          </Grid>
          
          {canEdit && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Add Photos
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
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default LogDetail;