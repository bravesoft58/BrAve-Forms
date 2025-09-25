const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, isAdmin } = require('../middleware/auth');

// Create a new project
router.post('/', auth, projectController.createProject);

// Get all projects for a user
router.get('/', auth, projectController.getProjects);

// Get a single project by ID
router.get('/:id', auth, projectController.getProjectById);

// Update a project
router.put('/:id', auth, projectController.updateProject);

// Archive a project
router.put('/:id/archive', auth, projectController.archiveProject);

module.exports = router;