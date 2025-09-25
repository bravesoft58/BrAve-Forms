import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', severity = 'primary' }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button onClick={onConfirm} color={severity} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;