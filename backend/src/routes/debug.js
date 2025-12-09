const express = require('express');
const router = express.Router();
const { debugLoggers } = require('../utils/debugLogger');
const featureFlags = require('../utils/featureFlags');

// Middleware to check if debug endpoints are enabled
const requireDebugMode = (req, res, next) => {
  if (!featureFlags.get('enableSessionEndpoint')) {
    return res.status(404).json({
      success: false,
      message: 'Debug endpoints are not enabled'
    });
  }
  next();
};

// In-memory storage for session debug data (for staging only)
// In production, this would be stored in database or cache
const sessionDebugData = new Map();

// Store debug data for a session
const storeSessionDebug = (sessionId, debugData) => {
  if (featureFlags.get('enableDebugLogging')) {
    sessionDebugData.set(sessionId, {
      ...debugData,
      timestamp: Date.now(),
      ttl: Date.now() + (24 * 60 * 60 * 1000) // 24 hours TTL
    });
    
    // Cleanup old entries
    cleanupExpiredSessions();
  }
};

// Clean up expired debug sessions
const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, data] of sessionDebugData.entries()) {
    if (data.ttl < now) {
      sessionDebugData.delete(sessionId);
    }
  }
};

// GET /debug/session/:sessionId - Get debug data for a session
router.get('/session/:sessionId', requireDebugMode, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    debugLoggers.api.debug(sessionId, 'Debug session data requested');
    
    const debugData = sessionDebugData.get(sessionId);
    
    if (!debugData) {
      return res.status(404).json({
        success: false,
        message: 'No debug data found for this session',
        sessionId
      });
    }
    
    // Sanitize sensitive data
    const sanitizedData = {
      sessionId,
      timestamp: new Date(debugData.timestamp).toISOString(),
      
      // Facts and normalization
      rawAnswers: debugData.rawAnswers ? Object.keys(debugData.rawAnswers) : [],
      normalizedFacts: debugData.normalizedFacts || {},
      
      // Rules evaluation
      rulesEvaluated: debugData.rulesEvaluated || 0,
      matchedRules: debugData.matchedRules || [],
      
      // Base recommendation
      baseRecommendation: {
        generated: !!debugData.baseRecommendation,
        summary: debugData.baseRecommendation?.summary?.substring(0, 100) + '...' || null,
        sections: debugData.baseRecommendation ? Object.keys(debugData.baseRecommendation) : []
      },
      
      // Confidence calculation
      confidenceBreakdown: debugData.confidenceBreakdown || {},
      
      // LLM processing
      llmProcessing: {
        attempted: !!debugData.llmRequest,
        requestHash: debugData.llmRequestHash || null,
        payloadSize: debugData.llmPayloadSize || 0,
        status: debugData.llmStatus || 'not_attempted',
        latencyMs: debugData.llmLatencyMs || 0,
        retryCount: debugData.llmRetryCount || 0,
        validationPassed: debugData.llmValidationPassed || false,
        errorMessage: debugData.llmError || null
      },
      
      // Final result
      finalResult: {
        hasLLMRefinement: debugData.hasLLMRefinement || false,
        totalLatencyMs: debugData.totalLatencyMs || 0,
        mode: debugData.inferenceMode || 'unknown'
      }
    };
    
    res.json({
      success: true,
      data: sanitizedData
    });
    
  } catch (error) {
    debugLoggers.api.error(req.params.sessionId, 'Error retrieving debug session data', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: featureFlags.get('isDevelopment') ? error.message : undefined
    });
  }
});

// GET /debug/health - System health check
router.get('/health', requireDebugMode, (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      debugLogging: featureFlags.get('enableDebugLogging'),
      inferenceMode: featureFlags.getInferenceMode(),
      llmEnabled: !!process.env.GROQ_API_KEY,
      databaseConnected: true // TODO: Add actual DB health check
    },
    stats: {
      activeDebugSessions: sessionDebugData.size,
      uptime: process.uptime()
    }
  };
  
  res.json({
    success: true,
    data: health
  });
});

// GET /debug/sessions - List all active debug sessions
router.get('/sessions', requireDebugMode, (req, res) => {
  const sessions = Array.from(sessionDebugData.entries()).map(([sessionId, data]) => ({
    sessionId,
    timestamp: new Date(data.timestamp).toISOString(),
    hasLLMData: !!data.llmStatus,
    inferenceMode: data.inferenceMode || 'unknown',
    status: data.finalStatus || 'unknown'
  }));
  
  res.json({
    success: true,
    data: {
      sessions,
      total: sessions.length
    }
  });
});

// POST /debug/test-profile - Test a profile against the inference engine
router.post('/test-profile', requireDebugMode, async (req, res) => {
  try {
    const { profileName, domainId, answers } = req.body;
    
    if (!profileName || !domainId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: profileName, domainId, answers'
      });
    }
    
    // Generate test session ID
    const testSessionId = `test_${profileName}_${Date.now()}`;
    
    debugLoggers.api.debug(testSessionId, 'Testing profile against inference engine', {
      profileName,
      domainId,
      answersCount: Object.keys(answers).length
    });
    
    // TODO: Integrate with actual inference engine
    // For now, return a placeholder response
    const testResult = {
      sessionId: testSessionId,
      profileName,
      domainId,
      status: 'completed',
      message: 'Profile testing endpoint ready - integration with inference engine pending'
    };
    
    res.json({
      success: true,
      data: testResult
    });
    
  } catch (error) {
    debugLoggers.api.error('test_profile', 'Error testing profile', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: featureFlags.get('isDevelopment') ? error.message : undefined
    });
  }
});

module.exports = {
  router,
  storeSessionDebug,
  cleanupExpiredSessions
};