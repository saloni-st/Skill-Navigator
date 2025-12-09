const mongoose = require('mongoose');

const testProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  // Normalized facts for rule testing
  facts: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Raw answers that generated these facts (for reference)
  rawAnswers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Expected rules that should fire for this profile
  expectedRules: [{
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rule'
    },
    ruleName: String,
    shouldFire: {
      type: Boolean,
      default: true
    },
    expectedContribution: {
      type: String,
      enum: ['primary', 'supplementary', 'minor']
    }
  }],
  // Test results history
  testResults: [{
    executedAt: {
      type: Date,
      default: Date.now
    },
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rulesEvaluated: Number,
    rulesFired: Number,
    matchedExpectedRules: Number,
    unexpectedRules: [{
      ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule'
      },
      ruleName: String
    }],
    missedExpectedRules: [{
      ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule'
      },
      ruleName: String
    }],
    executionTime: Number,
    confidence: Number,
    baseRecommendation: {
      skills: [String],
      resources: [String],
      projects: [String],
      timeline: String
    },
    trace: [mongoose.Schema.Types.Mixed]
  }],
  // Profile metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  tags: [String],
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'edge_case', 'regression'],
    default: 'beginner'
  },
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
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

// Indexes
testProfileSchema.index({ domainId: 1, isActive: 1 });
testProfileSchema.index({ category: 1 });
testProfileSchema.index({ tags: 1 });

// Methods
testProfileSchema.methods.runTest = async function(ruleEngine, userId) {
  try {
    const startTime = Date.now();
    
    // Run inference engine with this profile's facts
    const result = await ruleEngine.infer(this.domainId, Object.fromEntries(this.facts));
    
    const executionTime = Date.now() - startTime;
    
    // Analyze results against expected rules
    const analysis = this.analyzeTestResults(result);
    
    // Store test result
    const testResult = {
      executedAt: new Date(),
      executedBy: userId,
      rulesEvaluated: result.metadata.rulesEvaluated,
      rulesFired: result.metadata.rulesMatched,
      matchedExpectedRules: analysis.matchedExpected.length,
      unexpectedRules: analysis.unexpected,
      missedExpectedRules: analysis.missedExpected,
      executionTime,
      confidence: result.metadata.confidence,
      baseRecommendation: result.recommendation,
      trace: result.trace
    };
    
    this.testResults.push(testResult);
    this.usageCount += 1;
    this.lastUsed = new Date();
    
    await this.save();
    
    return {
      success: true,
      testResult,
      analysis,
      recommendation: result.recommendation,
      metadata: result.metadata,
      trace: result.trace
    };
    
  } catch (error) {
    console.error('Test profile execution failed:', error);
    throw error;
  }
};

testProfileSchema.methods.analyzeTestResults = function(inferenceResult) {
  const firedRules = inferenceResult.recommendation?.metadata?.appliedRules || [];
  const firedRuleNames = firedRules.map(r => r.name);
  
  const matchedExpected = [];
  const missedExpected = [];
  const unexpected = [];
  
  // Check expected rules
  this.expectedRules.forEach(expectedRule => {
    if (expectedRule.shouldFire) {
      if (firedRuleNames.includes(expectedRule.ruleName)) {
        matchedExpected.push(expectedRule);
      } else {
        missedExpected.push({
          ruleId: expectedRule.ruleId,
          ruleName: expectedRule.ruleName
        });
      }
    }
  });
  
  // Check for unexpected rules
  firedRules.forEach(firedRule => {
    const isExpected = this.expectedRules.some(er => 
      er.ruleName === firedRule.name && er.shouldFire
    );
    
    if (!isExpected) {
      unexpected.push({
        ruleId: null, // Would need to be populated from rule lookup
        ruleName: firedRule.name
      });
    }
  });
  
  return {
    matchedExpected,
    missedExpected,
    unexpected,
    accuracy: this.expectedRules.length > 0 
      ? (matchedExpected.length / this.expectedRules.length) * 100 
      : 0
  };
};

testProfileSchema.methods.getLatestTestResult = function() {
  return this.testResults.length > 0 
    ? this.testResults[this.testResults.length - 1]
    : null;
};

testProfileSchema.methods.getTestHistory = function(limit = 10) {
  return this.testResults
    .sort((a, b) => b.executedAt - a.executedAt)
    .slice(0, limit);
};

module.exports = mongoose.model('TestProfile', testProfileSchema);