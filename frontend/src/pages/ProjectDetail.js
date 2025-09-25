import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, CircularProgress, Tabs, Tab, Paper, List, ListItem, ListItemText, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, QrCode as QrCodeIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectsAPI, logsAPI } from '../api/api';
import useAuthStore from '../store/authStore';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  
  // Fetch project details
  const { data: project, isLoading, error } = useQuery(['project', id], () => projectsAPI.getProject(id));
  
  // Fetch logs for this project
  const { data: logs, isLoading: logsLoading } = useQuery(['logs', id], () => logsAPI.getLogs(id), {
    enabled: !!id,
  });

  // Delete log mutation
  const deleteLog = useMutation(logsAPI.deleteLog, {
    onSuccess: () => {
      queryClient.invalidateQueries(['logs', id]);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCreateLog = () => {
    navigate(`/projects/${id}/create-log`);
  };

  const handleViewLog = (logId) => {
    navigate(`/logs/${logId}`);
  };

  const handleDeleteLog = (logId) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      deleteLog.mutate(logId);
    }
  };

  const handleOpenQrDialog = () => {
    setOpenQrDialog(true);
  };

  const handleCloseQrDialog = () => {
    setOpenQrDialog(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" variant="h6">
          Error loading project: {error.message}
        </Typography>
      </Box>
    );
  }

  const projectData = project?.data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {projectData.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={handleOpenQrDialog}
            sx={{ mr: 2 }}
          >
            QR Code
          </Button>
          {(role === 'admin' || role === 'foreman') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateLog}
            >
              New Log
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="body1" paragraph>
        {projectData.description}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Chip label={`Created by: ${projectData.createdBy?.email}`} sx={{ mr: 1 }} />
        <Chip label={`Foremen: ${projectData.foremen?.length || 0}`} sx={{ mr: 1 }} />
        <Chip label={`Inspectors: ${projectData.inspectors?.length || 0}`} />
      </Box>

      <Box sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Logs" />
            <Tab label="Details" />
          </Tabs>
        </Box>

        {/* Logs Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            {logsLoading ? (
              <CircularProgress size={24} />
            ) : logs?.data?.length > 0 ? (
              <Paper>
                <List>
                  {logs.data.map((log) => (
                    <React.Fragment key={log._id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" onClick={() => handleViewLog(log._id)}>
                              <EditIcon />
                            </IconButton>
                            {(role === 'admin' || (role === 'foreman' && log.createdBy._id === projectData.createdBy._id)) && (
                              <IconButton edge="end" onClick={() => handleDeleteLog(log._id)}>
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={`Log - ${format(new Date(log.date), 'MMM dd, yyyy')}`}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {log.logType}
                              </Typography>
                              {` — ${log.content.substring(0, 50)}${log.content.length > 50 ? '...' : ''}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            ) : (
              <Typography variant="body1">
                No logs found for this project.
                {(role === 'admin' || role === 'foreman') && ' Create a new log to get started.'}
              </Typography>
            )}
          </Box>
        )}

        {/* Details Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created by:</strong> {projectData.createdBy?.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created at:</strong> {format(new Date(projectData.createdAt), 'MMM dd, yyyy')}
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Foremen
              </Typography>
              {projectData.foremen?.length > 0 ? (
                <List dense>
                  {projectData.foremen.map((foreman) => (
                    <ListItem key={foreman._id}>
                      <ListItemText primary={foreman.email} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No foremen assigned to this project.</Typography>
              )}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Inspectors
              </Typography>
              {projectData.inspectors?.length > 0 ? (
                <List dense>
                  {projectData.inspectors.map((inspector) => (
                    <ListItem key={inspector._id}>
                      <ListItemText primary={inspector.email} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No inspectors assigned to this project.</Typography>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* QR Code Dialog */}
      <Dialog open={openQrDialog} onClose={handleCloseQrDialog}>
        <DialogTitle>Project QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <QRCodeSVG
              value={`${window.location.origin}/projects/${id}`}
              size={200}
              level="H"
            />
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Scan this QR code to access the project directly.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;