const { Session, AuditLog } = require('../models');
const { validationResult } = require('express-validator');
const HardenedGroqService = require('../services/HardenedGroqService');

class ResultController {
  /**
   * Get complete result with roadmap and explainability
   * GET /api/results/:sessionId
   */
  static async getCompleteResult(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get session with populated domain - be more flexible with status
      console.log(`🔍 Looking for session ${sessionId} for user ${userId}`);
      
      const session = await Session.findOne({
        _id: sessionId,
        userId
      }).populate('domainId');

      if (!session) {
        console.log(`❌ Session ${sessionId} not found for user ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      console.log(`✅ Session found with status: ${session.status}`);
      
      // Check if session has any kind of recommendation data
      const hasRecommendation = session.recommendation || 
                               session.baseRecommendation || 
                               session.llmRecommendation;
      
      if (!hasRecommendation) {
        console.log(`⚠️ Session ${sessionId} has no recommendation data, status: ${session.status}`);
        
        // If the session is still processing, return a processing message
        if (session.status === 'in_progress' || session.status === 'inference_running') {
          return res.status(202).json({
            success: false,
            message: 'Assessment is still being processed. Please wait a moment and refresh.',
            status: 'processing',
            sessionStatus: session.status
          });
        }
        
        // If inference failed, return more helpful message
        if (session.status === 'inference_failed') {
          return res.status(400).json({
            success: false,
            message: 'Assessment processing failed. Please try retaking the assessment.',
            status: 'failed',
            sessionStatus: session.status
          });
        }
        
        return res.status(400).json({
          success: false,
          message: 'No recommendation available for this session',
          status: 'no_recommendation',
          sessionStatus: session.status
        });
      }

      // Calculate confidence score
      const confidenceScore = ResultController.calculateConfidenceScore(session);

      // Format explainability data
      const explainabilityData = ResultController.formatExplainabilityData(session);

      // Format roadmap data
      const roadmapData = ResultController.formatRoadmapData(session);

      // Get the recommendation data (try multiple sources)
      const mainRecommendation = session.recommendation || session.baseRecommendation || {};
      console.log(`📊 Main recommendation keys:`, Object.keys(mainRecommendation));
      
      // Check for new weekly plan format
      const hasNewWeeklyPlan = mainRecommendation.weeklyPlan && 
                              (mainRecommendation.weeklyPlan.weeklyBreakdown || 
                               mainRecommendation.weeklyPlan.overview);
      console.log(`📅 Has new weekly plan format:`, hasNewWeeklyPlan);

      // Get processing status info
      const processingInfo = {
        totalSteps: 2,
        completedSteps: 2,
        currentStep: 'completed',
        stepDetails: [
          { step: 1, name: 'Inference Engine', status: 'completed', duration: session.inferenceMetadata?.processingTime || 'N/A' },
          { step: 2, name: 'LLM Refinement', status: session.refinedRecommendation ? 'completed' : 'skipped', duration: session.llmMetadata?.processingTime || 'N/A' }
        ]
      };

      // Build response data
      const responseData = {
        sessionId: session._id,
        session: {
          id: session._id,
          domain: {
            id: session.domainId._id,
            name: session.domainId.name
          },
          createdAt: session.createdAt,
          completedAt: session.updatedAt
        },
        // Main recommendation data with enhanced weekly plan support
        baseRecommendation: mainRecommendation ? {
          ...mainRecommendation,
          summary: mainRecommendation.summary || ResultController.generateSummary(mainRecommendation),
          // Add new weekly plan structure
          weeklyPlan: hasNewWeeklyPlan ? {
            ...mainRecommendation.weeklyPlan,
            isNewFormat: true
          } : mainRecommendation.weeklyPlan,
          // Include real-time resources if available
          realTimeResources: mainRecommendation.realTimeResources
        } : null,
        llmRecommendation: session.refinedRecommendation ? {
          roadmap: session.refinedRecommendation,
          llmStatus: session.llmMetadata?.status || 'success'
        } : null,
        
        // Confidence and analysis
        confidence: confidenceScore,
        confidenceBreakdown: session.confidenceBreakdown || {
          totalPositive: confidenceScore,
          coverage: session.metadata?.coverage || 0.8,
          breakdown: session.metadata?.breakdown || []
        },
        
        // Debug/trace information
        trace: session.inferenceTrace || [],
        llmStatus: session.llmMetadata?.status || (session.refinedRecommendation ? 'success' : 'not_used'),
        
        // Legacy fields for roadmap view
        roadmap: roadmapData,
        explainability: explainabilityData,
        processing: processingInfo,
        actions: {
          canSave: true,
          canDownload: true,
          canClarify: !!session.refinedRecommendation,
          canRate: !session.userRating
        }
      };

      res.json({
        success: true,
        message: 'Complete result retrieved successfully',
        data: responseData
      });

    } catch (error) {
      console.error('Error getting complete result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve result',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Save result (bookmark for user)
   * POST /api/results/:sessionId/save
   */
  static async saveResult(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { title, notes } = req.body;
      const userId = req.user.id;

      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Update session with save metadata
      session.isSaved = true;
      session.savedAt = new Date();
      session.savedTitle = title || `${session.domainId?.name || 'Career'} Roadmap`;
      session.savedNotes = notes || '';

      await session.save();

      // Log the action
      await AuditLog.create({
        userId,
        action: 'result_saved',
        resource: 'session',
        resourceId: sessionId,
        details: { title: session.savedTitle },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Result saved successfully',
        data: {
          savedAt: session.savedAt,
          title: session.savedTitle,
          notes: session.savedNotes
        }
      });

    } catch (error) {
      console.error('Error saving result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save result',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Generate PDF download
   * GET /api/results/:sessionId/pdf
   */
  static async generatePDF(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
      }).populate('domainId');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // PDF functionality temporarily disabled
      return res.status(501).json({
        success: false,
        message: 'PDF download feature is currently unavailable'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Ask clarifying question using LLM
   * POST /api/results/:sessionId/clarify
   */
  static async askClarifyingQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { question } = req.body;
      const userId = req.user.id;

      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
      }).populate('domainId');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (!session.refinedRecommendation) {
        return res.status(400).json({
          success: false,
          message: 'LLM refinement not available for clarification'
        });
      }

      // Use hardened Groq service to answer clarifying question
      const llmService = new HardenedGroqService();
      const clarification = await llmService.answerClarifyingQuestion(
        question,
        {
          session: session,
          recommendation: session.recommendation,
          refinedRecommendation: session.refinedRecommendation
        },
        sessionId
      );

      // Log the clarification request
      await AuditLog.create({
        userId,
        action: 'clarification_asked',
        resource: 'session',
        resourceId: sessionId,
        details: { question },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Clarification provided successfully',
        data: {
          question,
          answer: clarification.answer,
          confidence: clarification.confidence || 'medium',
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error providing clarification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to provide clarification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Rate the recommendation
   * POST /api/results/:sessionId/rate
   */
  static async rateRecommendation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { rating, feedback, aspects } = req.body;
      const userId = req.user.id;

      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Store rating information
      session.userRating = {
        rating,
        feedback: feedback || '',
        aspects: aspects || [],
        ratedAt: new Date()
      };

      await session.save();

      // Log the rating
      await AuditLog.create({
        userId,
        action: 'recommendation_rated',
        resource: 'session',
        resourceId: sessionId,
        details: { rating, hasAspects: !!aspects?.length },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: {
          rating,
          submittedAt: session.userRating.ratedAt
        }
      });

    } catch (error) {
      console.error('Error rating recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit rating',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user's saved results
   * GET /api/results/saved
   */
  static async getSavedResults(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const savedSessions = await Session.find({
        userId,
        isSaved: true,
        status: 'completed'
      })
      .populate('domainId', 'name description')
      .select('savedTitle savedNotes savedAt domainId createdAt userRating')
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit);

      const totalCount = await Session.countDocuments({
        userId,
        isSaved: true,
        status: 'completed'
      });

      res.json({
        success: true,
        message: 'Saved results retrieved successfully',
        data: {
          results: savedSessions.map(session => ({
            id: session._id,
            title: session.savedTitle,
            notes: session.savedNotes,
            domain: session.domainId?.name,
            savedAt: session.savedAt,
            createdAt: session.createdAt,
            rating: session.userRating?.rating
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: skip + savedSessions.length < totalCount,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error getting saved results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve saved results',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get processing status for real-time updates
   * GET /api/results/:sessionId/status
   */
  static async getProcessingStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await Session.findOne({
        _id: sessionId,
        userId
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      let status = 'not_started';
      let currentStep = 0;
      let totalSteps = 2;

      if (session.status === 'started') {
        status = 'collecting_answers';
      } else if (session.status === 'completed' && !session.recommendation) {
        status = 'processing';
        currentStep = 1;
      } else if (session.recommendation && !session.refinedRecommendation) {
        status = 'refining';
        currentStep = 1;
      } else if (session.recommendation && session.refinedRecommendation) {
        status = 'completed';
        currentStep = 2;
      }

      res.json({
        success: true,
        data: {
          status,
          currentStep,
          totalSteps,
          steps: [
            { 
              step: 1, 
              name: 'Inference Engine', 
              status: session.recommendation ? 'completed' : (currentStep >= 1 ? 'processing' : 'pending'),
              description: 'Analyzing your profile and matching career rules'
            },
            { 
              step: 2, 
              name: 'LLM Refinement', 
              status: session.refinedRecommendation ? 'completed' : (currentStep >= 2 ? 'processing' : 'pending'),
              description: 'Enhancing recommendations with personalized explanations'
            }
          ],
          canCancel: status === 'processing' || status === 'refining'
        }
      });

    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get processing status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper methods
  static calculateConfidenceScore(session) {
    if (!session.recommendationMetadata) {
      return { score: 0, level: 'unknown' };
    }

    const baseConfidence = session.recommendationMetadata.confidence || 0;
    const rulesMatched = session.recommendationMetadata.rulesMatched || 0;
    const rulesEvaluated = session.recommendationMetadata.rulesEvaluated || 1;

    // Calculate coverage percentage
    const coverage = (rulesMatched / rulesEvaluated) * 100;
    
    // Adjust confidence based on coverage and number of matches
    let adjustedConfidence = baseConfidence;
    if (rulesMatched >= 3) adjustedConfidence *= 1.1;
    if (coverage > 30) adjustedConfidence *= 1.05;

    const score = Math.min(adjustedConfidence, 1.0);
    
    let level = 'low';
    if (score >= 0.8) level = 'high';
    else if (score >= 0.6) level = 'medium';

    return {
      score: Math.round(score * 100),
      level,
      coverage: Math.round(coverage),
      rulesMatched,
      rulesEvaluated
    };
  }

  static formatExplainabilityData(session) {
    const appliedRules = session.recommendationMetadata?.appliedRules || [];
    const trace = session.inferenceTrace || [];

    return {
      rulesApplied: appliedRules.map((rule, index) => ({
        number: index + 1,
        ruleName: rule.name,
        priority: rule.priority,
        contribution: rule.contribution,
        explanation: this.generateRuleExplanation(rule, session),
        matchedConditions: this.getMatchedConditions(rule, session)
      })),
      processingTrace: trace.slice(0, 6), // Limit trace for UI
      metadata: {
        totalRulesEvaluated: session.recommendationMetadata?.rulesEvaluated || 0,
        totalRulesMatched: session.recommendationMetadata?.rulesMatched || 0,
        processingTime: session.recommendationMetadata?.processingTime || 'N/A'
      }
    };
  }

  static formatRoadmapData(session) {
    const base = session.recommendation || {};
    const refined = session.refinedRecommendation || {};

    return {
      title: refined.title || `${session.domainId?.name} Career Roadmap`,
      summary: refined.whyThisPath || this.generateSummary(base),
      prioritySkills: refined.prioritySkills || base.skills?.slice(0, 5) || [],
      learningResources: refined.learningResources || base.resources?.slice(0, 3) || [],
      practiceProjects: refined.practiceProjects || base.projects?.slice(0, 2) || [],
      timeline: refined.timeline || base.timeline || 'Timeline not available',
      assumptions: refined.assumptions || [],
      rawRecommendation: base // For debugging/admin purposes
    };
  }

  static generateRuleExplanation(rule, session) {
    // Generate user-friendly explanation of why this rule matched
    const conditions = rule.matchedConditions || [];
    if (conditions.length === 0) {
      return `This rule was applied based on your profile characteristics.`;
    }

    return `Matched because: ${conditions.join(', ')}`;
  }

  static getMatchedConditions(rule, session) {
    // Extract which specific conditions were matched
    // This would need to be stored during inference for full detail
    return [];
  }

  static generateSummary(baseRecommendation) {
    const skills = baseRecommendation.skills || [];
    const timeline = baseRecommendation.timeline || '';
    
    if (skills.length > 0) {
      return `This roadmap focuses on ${skills.slice(0, 3).join(', ')} and other essential skills. ${timeline ? `Expected completion time: ${timeline}.` : ''}`;
    }
    
    return 'Personalized career roadmap based on your profile and goals.';
  }

  /**
   * Retry LLM refinement for a completed session
   * POST /api/results/:sessionId/retry-llm
   */
  static async retryLlmRefinement(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get session with populated domain
      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
      }).populate('domainId');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or not completed'
        });
      }

      if (!session.recommendation) {
        return res.status(400).json({
          success: false,
          message: 'No base recommendation available for refinement'
        });
      }

      // Initialize Hardened Groq service
      const hardenedGroqService = new HardenedGroqService();
      
      const startTime = Date.now();
      
      try {
        // Prepare refinement context
        const refinementContext = {
          baseRecommendation: session.recommendation,
          userProfile: {
            answers: session.answers,
            normalizedFacts: session.normalizedFacts || {}
          },
          inferenceTrace: session.inferenceTrace || []
        };

        // Attempt LLM refinement
        const refinedRecommendation = await hardenedGroqService.refineRecommendation(
          refinementContext,
          sessionId
        );

        const processingTime = Date.now() - startTime;

        // Update session with refined recommendation
        session.refinedRecommendation = refinedRecommendation.roadmap;
        session.llmMetadata = {
          status: 'success',
          processingTime: `${processingTime}ms`,
          retriedAt: new Date(),
          version: '1.0'
        };

        await session.save();

        res.json({
          success: true,
          message: 'LLM refinement completed successfully',
          data: {
            llmStatus: 'success',
            processingTime: `${processingTime}ms`,
            refinedRecommendation: refinedRecommendation.roadmap
          }
        });

      } catch (llmError) {
        console.error('LLM refinement failed on retry:', llmError);
        
        const processingTime = Date.now() - startTime;
        
        // Update session with failure status
        session.llmMetadata = {
          status: 'failed',
          error: llmError.message,
          processingTime: `${processingTime}ms`,
          retriedAt: new Date()
        };
        
        await session.save();

        res.json({
          success: true,
          message: 'LLM refinement failed, base recommendation still available',
          data: {
            llmStatus: 'failed',
            error: llmError.message,
            processingTime: `${processingTime}ms`
          }
        });
      }

    } catch (error) {
      console.error('Error retrying LLM refinement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry LLM refinement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Test method for development - no auth required
   * GET /api/results/test/:sessionId
   */
  static async getCompleteResultTest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;

      // Get session with populated domain - NO USER CHECK
      console.log(`🧪 TEST: Looking for session ${sessionId}`);
      
      const session = await Session.findOne({
        _id: sessionId
      }).populate('domainId');

      if (!session) {
        console.log(`❌ TEST: Session ${sessionId} not found`);
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      console.log(`✅ TEST: Session found with status: ${session.status}`);
      console.log(`📊 TEST: Session keys:`, Object.keys(session.toObject()));
      
      // Return raw session data for debugging
      return res.json({
        success: true,
        sessionId,
        session: {
          id: session._id,
          domain: session.domainId,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
          status: session.status
        },
        baseRecommendation: session.baseRecommendation,
        recommendation: session.recommendation,
        llmRecommendation: session.llmRecommendation,
        confidence: session.confidence,
        inferenceTrace: session.inferenceTrace
      });

    } catch (error) {
      console.error('🧪 TEST: Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve result',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ResultController;