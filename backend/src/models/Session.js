const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  normalizedFacts: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  baseRecommendation: {
    skills: [String],
    resources: [String],
    projects: [String],
    timeline: String,
    prerequisites: [String]
  },
  trace: [{
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rule'
    },
    ruleName: String,
    fired: Boolean,
    conditions: [mongoose.Schema.Types.Mixed],
    actions: [mongoose.Schema.Types.Mixed],
    explanation: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  recommendation: {
    skills: [String],
    resources: [String],
    projects: [String],
    timeline: String,
    warnings: [String],
    metadata: {
      appliedRules: [{
        name: String,
        priority: Number,
        contribution: String
      }],
      confidence: Number,
      reasoning: [String]
    }
  },
  recommendationGeneratedAt: Date,
  recommendationMetadata: {
    confidence: Number,
    rulesEvaluated: Number,
    rulesMatched: Number,
    appliedRules: [{
      name: String,
      priority: Number,
      contribution: String
    }],
    regenerated: Boolean,
    previousConfidence: Number,
    llmRefined: Boolean,
    llmFallback: Boolean
  },
  inferenceTrace: [mongoose.Schema.Types.Mixed],
  refinedRecommendation: {
    prioritySkills: String,
    learningResources: String,
    practiceProjects: String,
    timeline: String,
    whyThisPath: String,
    assumptions: String,
    fallback: Boolean
  },
  llmRecommendation: {
    roadmap: String,
    explanation: String,
    refinedTimeline: String,
    personalizedAdvice: String
  },
  status: {
    type: String,
    enum: ['started', 'draft', 'completed', 'inference_complete', 'llm_complete'],
    default: 'started'
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  // Phase 8: Result Page & UX fields
  isSaved: {
    type: Boolean,
    default: false
  },
  savedAt: Date,
  savedTitle: String,
  savedNotes: String,
  userRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    aspects: [{
      type: String,
      enum: ['accuracy', 'clarity', 'completeness', 'relevance', 'timeline']
    }],
    ratedAt: Date
  },
  pdfDownloads: [{
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    userAgent: String,
    ipAddress: String
  }],
  clarifyingQuestions: [{
    question: String,
    answer: String,
    confidence: String,
    askedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);