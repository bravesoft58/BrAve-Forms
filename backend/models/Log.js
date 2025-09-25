const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  photos: [{
    type: String
  }],
  logType: {
    type: String,
    enum: ['dust_control', 'swppp', 'safety', 'daily'],
    required: true
  },
  formData: {
    type: Object
  }
}, {
  timestamps: true
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;