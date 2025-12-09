const winston = require('winston');

// Create different log formats for different environments
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, sessionId, component, ...meta }) => {
    const sessionInfo = sessionId ? `[${sessionId}]` : '';
    const componentInfo = component ? `[${component}]` : '';
    const metaInfo = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${sessionInfo}${componentInfo} ${message} ${metaInfo}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'skillnavigator-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Debug logging helpers for different components
const createDebugLogger = (component) => ({
  debug: (sessionId, message, meta = {}) => {
    if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
      logger.debug(message, { sessionId, component, ...meta });
    }
  },
  
  info: (sessionId, message, meta = {}) => {
    logger.info(message, { sessionId, component, ...meta });
  },
  
  warn: (sessionId, message, meta = {}) => {
    logger.warn(message, { sessionId, component, ...meta });
  },
  
  error: (sessionId, message, error = null, meta = {}) => {
    const errorMeta = error ? { 
      error: error.message, 
      stack: error.stack,
      ...meta 
    } : meta;
    logger.error(message, { sessionId, component, ...errorMeta });
  }
});

// Component-specific loggers
const debugLoggers = {
  rules: createDebugLogger('RULES'),
  inference: createDebugLogger('INFERENCE'), 
  llm: createDebugLogger('LLM'),
  confidence: createDebugLogger('CONFIDENCE'),
  session: createDebugLogger('SESSION'),
  facts: createDebugLogger('FACTS'),
  api: createDebugLogger('API')
};

// Log key checkpoints in the inference pipeline
const logInferencePipeline = {
  
  // Step 1: Rule Loading
  rulesLoaded: (sessionId, domainId, rulesCount, activeRulesCount) => {
    debugLoggers.rules.debug(sessionId, 'Rules loaded for domain', {
      domainId,
      totalRules: rulesCount,
      activeRules: activeRulesCount
    });
  },
  
  // Step 2: Facts Normalization  
  factsNormalized: (sessionId, rawAnswers, normalizedFacts) => {
    debugLoggers.facts.debug(sessionId, 'Facts normalized from answers', {
      rawAnswersCount: Object.keys(rawAnswers).length,
      normalizedFacts: normalizedFacts,
      factsExtracted: Object.keys(normalizedFacts).length
    });
  },
  
  // Step 3: Rule Matching
  rulesMatched: (sessionId, matchedRules, totalEvaluated) => {
    debugLoggers.rules.debug(sessionId, 'Rules evaluation completed', {
      totalEvaluated,
      matched: matchedRules.length,
      matchedRuleIds: matchedRules.map(r => r.id),
      topMatches: matchedRules.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title,
        matchStrength: r.matchStrength,
        priority: r.priority
      }))
    });
  },
  
  // Step 4: Base Recommendation
  baseRecommendationGenerated: (sessionId, baseRec, confidenceScore) => {
    debugLoggers.inference.debug(sessionId, 'Base recommendation generated', {
      hasRecommendation: !!baseRec,
      recommendationKeys: baseRec ? Object.keys(baseRec) : [],
      confidence: confidenceScore,
      recommendationLength: baseRec?.summary?.length || 0
    });
  },
  
  // Step 5: Confidence Calculation
  confidenceCalculated: (sessionId, breakdown) => {
    debugLoggers.confidence.debug(sessionId, 'Confidence score calculated', {
      confidence: breakdown.confidence,
      totalPositive: breakdown.totalPositive,
      maxPossible: breakdown.maxPossible,
      coverage: breakdown.coverage,
      coverageFactor: breakdown.coverageFactor,
      ruleContributions: breakdown.ruleScores?.length || 0
    });
  },
  
  // Step 6: LLM Request
  llmRequestPrepared: (sessionId, requestHash, payloadSize, timeout) => {
    debugLoggers.llm.debug(sessionId, 'LLM request prepared', {
      requestHash,
      payloadSize,
      timeout,
      timestamp: Date.now()
    });
  },
  
  // Step 7: LLM Response
  llmResponseReceived: (sessionId, status, latencyMs, responseSize, validationPassed) => {
    debugLoggers.llm.info(sessionId, 'LLM response processed', {
      status,
      latencyMs,
      responseSize,
      validationPassed,
      timestamp: Date.now()
    });
  },
  
  // Step 8: Final Result
  finalResultReturned: (sessionId, hasLLMRefinement, llmStatus, totalLatencyMs) => {
    debugLoggers.api.info(sessionId, 'Final inference result returned', {
      hasLLMRefinement,
      llmStatus,
      totalLatencyMs,
      timestamp: Date.now()
    });
  },
  
  // Error tracking
  inferenceError: (sessionId, step, error, context = {}) => {
    debugLoggers.inference.error(sessionId, `Inference error at step: ${step}`, error, context);
  }
};

// Utility functions for hashing and sanitization
const utils = {
  // Create consistent hash for request payloads (for caching/deduplication)
  createRequestHash: (payload) => {
    const crypto = require('crypto');
    const normalizedPayload = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(normalizedPayload).digest('hex').substring(0, 16);
  },
  
  // Sanitize sensitive data for logging
  sanitizeForLog: (data) => {
    const sanitized = { ...data };
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'email', 'apiKey', 'token'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  },
  
  // Extract session ID from various request formats
  extractSessionId: (req) => {
    return req.sessionId || 
           req.params?.sessionId || 
           req.body?.sessionId || 
           req.query?.sessionId || 
           'unknown';
  }
};

module.exports = {
  logger,
  debugLoggers,
  logInferencePipeline,
  utils
};