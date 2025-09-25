const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { auth } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Create a new log
router.post('/', auth, logController.createLog);

// Get all logs for a project
router.get('/', auth, logController.getLogs);

// Get a single log by ID
router.get('/:id', auth, logController.getLogById);

// Update a log
router.put('/:id', auth, logController.updateLog);

// Delete a log
router.delete('/:id', auth, logController.deleteLog);

// Upload photo
router.post('/upload-photo', auth, upload.single('photo'), logController.uploadPhoto);

module.exports = router;