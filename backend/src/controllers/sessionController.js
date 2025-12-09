const Session = require('../models/Session');
const Domain = require('../models/Domain');
const QuestionSet = require('../models/QuestionSet');
const AuditLog = require('../models/AuditLog');
const Joi = require('joi');

// Validation schemas
const startSessionSchema = Joi.object({
  domainId: Joi.string().required()
});

const draftAnswersSchema = Joi.object({
  domainId: Joi.string().required(),
  answers: Joi.object().pattern(
    Joi.string(), // questionId
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.array().items(Joi.string())
    )
  ).required()
});

const finalAnswersSchema = Joi.object({
  answers: Joi.object().pattern(
    Joi.string(), // questionId
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.array().items(Joi.string())
    )
  ).required()
});

// @desc    Start a new session
// @route   POST /api/sessions
// @access  Private
const startSession = async (req, res, next) => {
  try {
    // Validate request
    const { error, value } = startSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { domainId } = value;

    // Verify domain exists and is active
    const domain = await Domain.findById(domainId);
    if (!domain || !domain.active) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found or inactive'
      });
    }

    // Create new session
    const session = new Session({
      userId: req.user.id,
      domainId,
      answers: new Map(),
      status: 'started'
    });

    await session.save();

    // Log session creation
    await AuditLog.create({
      userId: req.user.id,
      event: 'session_started',
      details: {
        sessionId: session._id,
        domainId: domain._id,
        domainName: domain.name
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      data: {
        sessionId: session._id,
        domainId: domain._id,
        domainName: domain.name,
        status: session.status,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create or update session draft
// @route   POST /api/sessions/draft
// @access  Private
const saveDraftSession = async (req, res, next) => {
  try {
    // Validate request
    const { error, value } = draftAnswersSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { domainId, answers } = value;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Check for existing draft session
    let session = await Session.findOne({
      userId: req.user._id,
      domainId: domainId,
      status: 'started'
    });

    if (session) {
      // Update existing draft
      session.answers = new Map(Object.entries(answers));
      session.updatedAt = Date.now();
      await session.save();
    } else {
      // Create new draft session
      session = await Session.create({
        userId: req.user._id,
        domainId: domainId,
        answers: new Map(Object.entries(answers)),
        status: 'started'
      });
    }

    // Log the event
    await AuditLog.create({
      userId: req.user._id,
      sessionId: session._id,
      event: 'session_draft_saved',
      payload: {
        domainId,
        answersCount: Object.keys(answers).length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Draft session saved',
      data: {
        sessionId: session._id,
        domainId: session.domainId,
        answersCount: Object.keys(answers).length,
        lastUpdated: session.updatedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Submit final answers and start processing
// @route   POST /api/sessions/submit
// @access  Private
const submitFinalAnswers = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { answers } = req.body;
    
    console.log('🚀 submitFinalAnswers called');
    console.log('- sessionId:', sessionId);
    console.log('- answers:', answers);

    // Find the session
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id
    }).populate('domainId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('✅ Session found:', session._id);
    console.log('✅ Domain:', session.domainId._id);

    // Convert answers to Map for MongoDB
    const answersMap = new Map();
    for (const [key, value] of Object.entries(answers)) {
      answersMap.set(key, value);
    }

    // Update session with answers and set valid status
    session.answers = answersMap;
    session.status = 'completed'; // Use valid enum value
    await session.save();

    console.log('💾 Session updated with answers, starting inference...');

    // Phase 5: Trigger NEW LLM-based inference processing
    try {
      console.log('🚀 Starting NEW LLM-based inference with user answers');
      const { RuleEngine } = require('../services/InferenceEngine');
      const inferenceEngine = new RuleEngine();
      
      console.log('📝 Calling NEW generateLearningPathFromAnswers with:');
      console.log('- domainId:', session.domainId._id);
      console.log('- sessionId:', session._id);
      console.log('- answers:', answers);
      
      // NEW: Call the enhanced LLM-based inference method with user profile integration
      const inferenceResult = await inferenceEngine.generateLearningPathFromAnswers(
        session.domainId._id.toString(), 
        answers, 
        {
          id: session._id.toString(),
          userId: req.user.id, // ADD: Pass userId for profile integration!
          domain: session.domainId
        }
      );
      
      console.log('✅ NEW LLM-based inference completed, result keys:', Object.keys(inferenceResult));
      console.log('📊 Recommendation includes:', {
        hasWeeklyPlan: !!inferenceResult.recommendation?.weeklyPlan,
        hasRealResources: !!inferenceResult.recommendation?.realTimeResources,
        skillsCount: inferenceResult.recommendation?.skills?.length || 0,
        source: inferenceResult.metadata?.source
      });
      
      // Update session with NEW inference results
      await Session.findByIdAndUpdate(session._id, { 
        status: 'inference_complete',
        completedAt: new Date(),
        baseRecommendation: { skills: [], resources: [], projects: [], prerequisites: [] }, // Empty base recommendation
        llmRecommendation: {
          roadmap: JSON.stringify({
            success: true,
            learningPath: inferenceResult.recommendation || {},
            userProfile: inferenceResult.userProfile || {},
            generatedAt: new Date().toISOString(),
            source: 'groq_llm_with_real_search'
          })
        },
        inferenceTrace: inferenceResult.trace || [],
        confidence: inferenceResult.metadata?.confidence || 0.9
      });
      
      console.log('💾 Session updated with NEW LLM-based inference results');
      
    } catch (inferenceError) {
      console.error('❌ NEW LLM-based inference error:', inferenceError);
      console.error('Stack:', inferenceError.stack);
      
      // Fallback to old inference method
      try {
        console.log('🔄 Falling back to traditional inference engine...');
        const { RuleEngine } = require('../services/InferenceEngine');
        const inferenceEngine = new RuleEngine();
        
        const fallbackResult = await inferenceEngine.infer(
          session.domainId._id.toString(), 
          answers, 
          session._id.toString()
        );
        
        await Session.findByIdAndUpdate(session._id, { 
          status: 'inference_complete',
          completedAt: new Date(),
          baseRecommendation: { skills: [], resources: [], projects: [], prerequisites: [] }, // Empty base recommendation
          llmRecommendation: {}, // Empty LLM recommendation for fallback
          inferenceTrace: fallbackResult.trace || [],
          confidence: fallbackResult.metadata?.confidence || 0.5
        });
        
        console.log('✅ Fallback inference completed successfully');
        
      } catch (fallbackError) {
        console.error('❌ Both LLM and traditional inference failed:', fallbackError);
        
        // Update session status to indicate inference failure
        await Session.findByIdAndUpdate(session._id, { 
          status: 'inference_failed',
          completedAt: new Date(),
          baseRecommendation: { skills: [], resources: [], projects: [], prerequisites: [] }, // Empty base recommendation
          llmRecommendation: {}, // Empty LLM recommendation for failure
          inferenceError: `LLM: ${inferenceError.message}, Fallback: ${fallbackError.message}`
        });
        
        console.log('⚠️ All inference methods failed');
      }
    }

    // Log the submission for audit
    await AuditLog.create({
      userId: req.user._id,
      event: 'answers_submitted',
      details: {
        sessionId: session._id,
        domainId: session.domainId._id,
        answersCount: Object.keys(answers).length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Answers submitted successfully. Processing recommendations...',
      data: {
        sessionId: session._id,
        status: 'completed',
        submittedAt: session.updatedAt,
        processingMessage: 'Your career recommendations are being generated. Please check back in a moment.'
      }
    });

  } catch (error) {
    console.error('💥 Error in submitFinalAnswers:', error);
    next(error);
  }
};

// @desc    Get user's session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('domainId', 'name description');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Convert Map to Object for JSON response
    const answersObj = {};
    session.answers.forEach((value, key) => {
      answersObj[key] = value;
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          domain: session.domainId,
          answers: answersObj,
          status: session.status,
          baseRecommendation: session.baseRecommendation,
          llmRecommendation: session.llmRecommendation,
          recommendations: session.recommendations || [],
          inferenceTrace: session.inferenceTrace || [],
          confidence: session.confidence || 0,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          completedAt: session.completedAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's sessions (history)
// @route   GET /api/sessions
// @access  Private
const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .populate('domainId', 'name description')
      .sort({ updatedAt: -1 })
      .limit(20);

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      domain: session.domainId,
      status: session.status,
      answersCount: session.answers.size,
      hasRecommendation: !!session.baseRecommendation,
      hasLLMRefinement: !!session.llmRecommendation,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    res.json({
      success: true,
      count: formattedSessions.length,
      data: {
        sessions: formattedSessions
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    console.log(`🗑️ Delete session request:`, {
      sessionId,
      userId,
      userObject: req.user
    });

    // Find and verify session ownership
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have permission to delete it'
      });
    }

    // Delete the session
    await Session.findByIdAndDelete(sessionId);

    console.log(`✅ Session ${sessionId} deleted successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    next(error);
  }
};

module.exports = {
  startSession,
  saveDraftSession,
  submitFinalAnswers,
  getSession,
  getUserSessions,
  deleteSession,
};