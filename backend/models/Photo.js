const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  logId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Log',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;