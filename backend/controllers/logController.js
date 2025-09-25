const Log = require('../models/Log');
const Project = require('../models/Project');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// Cache duration in seconds
const CACHE_DURATION = 1800; // 30 minutes

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a new log
exports.createLog = async (req, res) => {
  try {
    const { projectId, date, content, photos, logType, formData } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to create logs for this project
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && 
        !project.foremen.includes(req.userId) && 
        project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create new log
    const log = new Log({
      projectId,
      createdBy: req.userId,
      date: new Date(date),
      content,
      photos: photos || [],
      logType,
      formData: formData || {}
    });

    await log.save();

    // Add log to project's logs array
    project.logs.push(log._id);
    await project.save();

    // Clear relevant caches
    await cache.del(`logs:project:${projectId}`);
    await cache.del(`project:${projectId}`);

    res.status(201).json({
      message: 'Log created successfully',
      logId: log._id
    });
  } catch (error) {
    logger.error('Create log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all logs for a project
exports.getLogs = async (req, res) => {
  try {
    const { projectId } = req.query;
    const cacheKey = `logs:project:${projectId}`;

    // Try to get from cache first
    const cachedLogs = await cache.get(cacheKey);
    if (cachedLogs) {
      return res.status(200).json(cachedLogs);
    }

    // Check if project exists
    const project = await Project.findById(projectId);
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

    // Get logs for project
    const logs = await Log.find({ projectId })
      .populate('createdBy', 'email')
      .sort({ date: -1 });

    // Cache the results
    await cache.set(cacheKey, logs, CACHE_DURATION);

    res.status(200).json(logs);
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single log by ID
exports.getLogById = async (req, res) => {
  try {
    const cacheKey = `log:${req.params.id}`;

    // Try to get from cache first
    const cachedLog = await cache.get(cacheKey);
    if (cachedLog) {
      return res.status(200).json(cachedLog);
    }

    const log = await Log.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('projectId');

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Check if user has access to this log's project
    const project = await Project.findById(log.projectId);
    const user = await User.findById(req.userId);

    if (user.role !== 'admin' && 
        !project.foremen.includes(req.userId) && 
        !project.inspectors.includes(req.userId) && 
        project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cache the result
    await cache.set(cacheKey, log, CACHE_DURATION);

    res.status(200).json(log);
  } catch (error) {
    logger.error('Get log by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update a log
exports.updateLog = async (req, res) => {
  try {
    const { content, photos, formData } = req.body;

    // Find log
    const log = await Log.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Check if user has permission to update this log
    const project = await Project.findById(log.projectId);
    const user = await User.findById(req.userId);

    if (user.role !== 'admin' && 
        !project.foremen.includes(req.userId) && 
        log.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update log
    log.content = content || log.content;
    log.photos = photos || log.photos;
    log.formData = formData || log.formData;

    await log.save();

    // Clear relevant caches
    await cache.del(`log:${req.params.id}`);
    await cache.del(`logs:project:${log.projectId}`);

    res.status(200).json({
      message: 'Log updated successfully',
      log
    });
  } catch (error) {
    logger.error('Update log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a log
exports.deleteLog = async (req, res) => {
  try {
    // Find log
    const log = await Log.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Check if user has permission to delete this log
    const project = await Project.findById(log.projectId);
    const user = await User.findById(req.userId);

    if (user.role !== 'admin' && 
        project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete photos from local storage if they exist
    if (log.photos && log.photos.length > 0) {
      for (const photoUrl of log.photos) {
        const fileName = photoUrl.split('/').pop();
        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Remove log from project's logs array
    await Project.findByIdAndUpdate(log.projectId, {
      $pull: { logs: log._id }
    });

    // Delete log
    await Log.findByIdAndDelete(req.params.id);

    // Clear relevant caches
    await cache.del(`log:${req.params.id}`);
    await cache.del(`logs:project:${log.projectId}`);

    res.status(200).json({
      message: 'Log deleted successfully'
    });
  } catch (error) {
    logger.error('Delete log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId, logId } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to upload photos for this project
    const user = await User.findById(req.userId);
    if (user.role !== 'admin' && 
        !project.foremen.includes(req.userId) && 
        project.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Save file locally
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const photoUrl = `/uploads/${fileName}`;

    // If logId is provided, add photo URL to log
    if (logId) {
      const log = await Log.findById(logId);
      if (log) {
        log.photos.push(photoUrl);
        await log.save();

        // Clear relevant caches
        await cache.del(`log:${logId}`);
        await cache.del(`logs:project:${projectId}`);
      }
    }

    res.status(200).json({
      message: 'Photo uploaded successfully',
      photoUrl
    });
  } catch (error) {
    logger.error('Upload photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};