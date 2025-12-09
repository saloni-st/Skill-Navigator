const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  recommendations: {
    skills: [String],
    resources: [String], 
    projects: [String],
    timeline: String,
    warnings: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Rule', ruleSchema);