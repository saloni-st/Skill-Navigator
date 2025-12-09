const mongoose = require('mongoose');

// Rule version schema for versioning system
const ruleVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  matchMode: {
    type: String,
    enum: ['all', 'any'],
    default: 'all'
  },
  conditions: [{
    factKey: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  actions: [{
    type: {
      type: String,
      enum: ['recommendSkill', 'recommendResource', 'recommendProject', 'addScore', 'addWarning'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    },
    description: {
      type: String,
      trim: true
    }
  }],
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Main rule schema with versioning
const ruleSchema = new mongoose.Schema({
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Current active version data (for quick access)
  currentVersion: {
    type: Number,
    default: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  matchMode: {
    type: String,
    enum: ['all', 'any'],
    default: 'all'
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  actions: [{
    type: {
      type: String,
      enum: ['recommendSkill', 'recommendResource', 'recommendProject', 'addScore', 'addWarning'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  // Version history
  versions: [ruleVersionSchema],
  // Publishing info
  publishedVersion: {
    type: Number,
    default: null
  },
  lastPublishedAt: Date,
  lastPublishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Testing metadata
  testResults: [{
    testProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestProfile'
    },
    version: Number,
    fired: Boolean,
    executionTime: Number,
    testedAt: Date,
    testedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Performance metrics
  metrics: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulMatches: {
      type: Number,
      default: 0
    },
    averageExecutionTime: {
      type: Number,
      default: 0
    },
    lastExecuted: Date
  },
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
ruleSchema.index({ domainId: 1, isActive: 1 });
ruleSchema.index({ priority: -1 });
ruleSchema.index({ status: 1 });
ruleSchema.index({ 'versions.version': 1 });

// Methods
ruleSchema.methods.createVersion = function(versionData, userId) {
  const newVersion = this.versions.length + 1;
  
  const version = {
    ...versionData,
    version: newVersion,
    createdBy: userId,
    createdAt: new Date()
  };
  
  this.versions.push(version);
  this.currentVersion = newVersion;
  this.updatedBy = userId;
  
  return version;
};

ruleSchema.methods.publishVersion = function(versionNumber, userId) {
  const version = this.versions.find(v => v.version === versionNumber);
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Update current active data
  this.title = version.title;
  this.matchMode = version.matchMode;
  this.conditions = this.convertConditionsToMixed(version.conditions);
  this.actions = version.actions;
  this.explanation = version.explanation;
  this.priority = version.priority;
  this.isActive = true;
  this.status = 'active';
  this.publishedVersion = versionNumber;
  this.lastPublishedAt = new Date();
  this.lastPublishedBy = userId;
  
  // Mark version as published
  version.isPublished = true;
  version.publishedAt = new Date();
  
  return version;
};

ruleSchema.methods.convertConditionsToMixed = function(conditions) {
  // Convert structured conditions to the Mixed format expected by inference engine
  const mixed = {};
  
  conditions.forEach(condition => {
    mixed[condition.factKey] = condition.value;
  });
  
  return mixed;
};

ruleSchema.methods.getVersionHistory = function() {
  return this.versions.sort((a, b) => b.version - a.version);
};

ruleSchema.methods.rollbackToVersion = function(versionNumber, userId) {
  return this.publishVersion(versionNumber, userId);
};

module.exports = mongoose.model('RuleV2', ruleSchema);