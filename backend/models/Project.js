const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foremen: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inspectors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  logs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log'
  }],
  qrCode: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;