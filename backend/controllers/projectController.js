const Project = require('../models/Project');
const User = require('../models/User');
const qrcode = require('qrcode');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// Cache duration in seconds
const CACHE_DURATION = 3600; // 1 hour

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, location, foremen, inspectors } = req.body;

    // Create new project
    const project = new Project({
      name,
      description,
      location,
      createdBy: req.userId,
      foremen: foremen || [],
      inspectors: inspectors || []
    });

    await project.save();

    // Generate QR code for project
    const qrCodeData = `${process.env.FRONTEND_URL}/projects/${project._id}`;
    const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
    
    // Update project with QR code URL
    project.qrCode = qrCodeUrl;
    await project.save();

    // Add project to users' projects array
    const userIds = [...new Set([...project.foremen, ...project.inspectors])];
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { projects: project._id } }
    );

    // Clear projects cache
    await cache.del('projects:all');
    await cache.del(`projects:user:${req.userId}`);

    res.status(201).json({
      message: 'Project created successfully',
      projectId: project._id,
      qrCode: project.qrCode
    });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const cacheKey = `projects:user:${req.userId}`;
    
    // Try to get from cache first
    const cachedProjects = await cache.get(cacheKey);
    if (cachedProjects) {
      return res.status(200).json(cachedProjects);
    }

    // Get projects from database
    const user = await User.findById(req.userId);
    let projects;

    if (user.role === 'admin') {
      projects = await Project.find()
        .populate('createdBy', 'email')
        .populate('foremen', 'email')
        .populate('inspectors', 'email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [
          { createdBy: req.userId },
          { foremen: req.userId },
          { inspectors: req.userId }
        ]
      })
        .populate('createdBy', 'email')
        .populate('foremen', 'email')
        .populate('inspectors', 'email')
        .sort({ createdAt: -1 });
    }

    // Cache the results
    await cache.set(cacheKey, projects, CACHE_DURATION);

    res.status(200).json(projects);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const cacheKey = `project:${req.params.id}`;
    
    // Try to get from cache first
    const cachedProject = await cache.get(cacheKey);
    if (cachedProject) {
      return res.status(200).json(cachedProject);
    }

    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('foremen', 'email')
      .populate('inspectors', 'email')
      .populate('logs');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has access to this project
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && 
        !project.foremen.includes(req.userId) && 
        !project.inspectors.includes(req.userId) && 
        project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cache the result
    await cache.set(cacheKey, project, CACHE_DURATION);

    res.status(200).json(project);
  } catch (error) {
    logger.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, location, foremen, inspectors } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to update this project
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update project
    project.name = name || project.name;
    project.description = description || project.description;
    project.location = location || project.location;
    project.foremen = foremen || project.foremen;
    project.inspectors = inspectors || project.inspectors;

    await project.save();

    // Clear relevant caches
    await cache.del(`project:${req.params.id}`);
    await cache.del('projects:all');
    await cache.del(`projects:user:${req.userId}`);

    res.status(200).json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Archive a project
exports.archiveProject = async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has permission to archive
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Archive project
    project.isArchived = true;
    await project.save();
    
    // Clear relevant caches
    await cache.del(`project:${req.params.id}`);
    await cache.del('projects:all');
    await cache.del(`projects:user:${req.userId}`);

    res.status(200).json({
      message: 'Project archived successfully'
    });
  } catch (error) {
    logger.error('Archive project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to delete this project
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Project.findByIdAndDelete(req.params.id);

    // Clear relevant caches
    await cache.del(`project:${req.params.id}`);
    await cache.del('projects:all');
    await cache.del(`projects:user:${req.userId}`);

    res.status(200).json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};