const { RuleEngine } = require('../services/InferenceEngine');
const HardenedGroqService = require('../services/HardenedGroqService');
const { Session, AuditLog } = require('../models');
const { validationResult } = require('express-validator');
const { debugLoggers } = require('../utils/debugLogger');

class InferenceController {
  /**
   * Generate recommendations based on session answers
   * POST /api/inference/:sessionId/recommend
   */
  static async generateRecommendation(req, res) {
    try {
      // Check validation errors
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
        $or: [
          { status: 'completed' },
          { status: 'in_progress', answers: { $exists: true, $ne: null } }
        ]
      }).populate('domainId');
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or not completed'
        });
      }
      
      // Check if recommendation already exists AND has proper metadata
      if (session.recommendation && session.recommendationMetadata && session.recommendationMetadata.confidence !== undefined) {
        return res.status(200).json({
          success: true,
          message: 'Recommendation already exists',
          data: {
            recommendation: session.recommendation,
            generatedAt: session.recommendationGeneratedAt,
            confidence: session.recommendationMetadata.confidence
          }
        });
      }
      
      // Initialize inference engine
      const engine = new RuleEngine();
      
      // Convert Map to plain object for inference
      const answers = {};
      for (const [key, value] of session.answers.entries()) {
        answers[key] = value;
      }
      
      // Generate recommendation
      const result = await engine.infer(session.domainId._id, answers, sessionId);
      
      // Initialize hardened Groq refinement service
      const llmService = new HardenedGroqService();
      
      // Refine recommendation with hardened LLM if enabled
      let refinedRecommendation = null;
      const useLLM = process.env.ENABLE_LLM_REFINEMENT !== 'false'; // Default enabled
      
      if (useLLM) {
        try {
          debugLoggers.inference.info('Starting hardened Groq refinement', { sessionId });
          refinedRecommendation = await llmService.refineRecommendation(
            result.recommendation, 
            result.trace, 
            session.userProfile || {}, 
            session.domainId.name, 
            sessionId
          );
          debugLoggers.inference.info('Hardened Groq refinement completed', { 
            sessionId,
            fallback: refinedRecommendation?.llmStatus !== 'success'
          });
        } catch (error) {
          debugLoggers.inference.error('Hardened Groq refinement failed', { 
            sessionId,
            error: error.message 
          });
          refinedRecommendation = null;
        }
      } else {
        debugLoggers.inference.info('LLM refinement disabled', { sessionId });
      }
      
      // Store recommendation in session
      session.recommendation = result.recommendation;
      session.recommendationGeneratedAt = new Date();
      session.recommendationMetadata = {
        confidence: result.metadata.confidence,
        rulesEvaluated: result.metadata.rulesEvaluated,
        rulesMatched: result.metadata.rulesMatched,
        appliedRules: result.recommendation.metadata.appliedRules.map(r => ({
          name: r.name,
          priority: r.priority,
          contribution: r.contribution
        })),
        llmRefined: !!refinedRecommendation,
        llmFallback: refinedRecommendation?.llmStatus !== 'success'
      };
      session.inferenceTrace = result.trace;
      
      // Store refined recommendation if available
      if (refinedRecommendation) {
        session.refinedRecommendation = refinedRecommendation;
      }
      
      // Mark session as completed now that recommendation is generated
      session.status = 'completed';
      
      await session.save();
      
      // Log the recommendation generation
      await AuditLog.create({
        userId,
        event: 'recommendation_generated',
        details: {
          sessionId: session._id,
          domainId: session.domainId._id,
          confidence: result.metadata.confidence,
          rulesMatched: result.metadata.rulesMatched
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(200).json({
        success: true,
        message: 'Recommendation generated successfully',
        data: {
          recommendation: result.recommendation,
          refinedRecommendation: refinedRecommendation,
          confidence: result.metadata.confidence,
          metadata: {
            rulesEvaluated: result.metadata.rulesEvaluated,
            rulesMatched: result.metadata.rulesMatched,
            domainName: session.domainId.name
          }
        }
      });
      
    } catch (error) {
      console.error('Error generating recommendation:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get existing recommendation for a session
   * GET /api/inference/:sessionId/recommendation
   */
  static async getRecommendation(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      const session = await Session.findOne({
        _id: sessionId,
        userId
      }).populate('domainId', 'name description');
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      if (!session.recommendation) {
        return res.status(404).json({
          success: false,
          message: 'No recommendation found for this session'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Recommendation retrieved successfully',
        data: {
          recommendation: session.recommendation,
          refinedRecommendation: session.refinedRecommendation,
          generatedAt: session.recommendationGeneratedAt,
          metadata: session.recommendationMetadata,
          domain: {
            id: session.domainId._id,
            name: session.domainId.name,
            description: session.domainId.description
          }
        }
      });
      
    } catch (error) {
      console.error('Error retrieving recommendation:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get inference trace for debugging (admin/development only)
   * GET /api/inference/:sessionId/trace
   */
  static async getInferenceTrace(req, res) {
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
      
      if (!session.inferenceTrace) {
        return res.status(404).json({
          success: false,
          message: 'No inference trace found for this session'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Inference trace retrieved successfully',
        data: {
          trace: session.inferenceTrace,
          metadata: session.recommendationMetadata,
          generatedAt: session.recommendationGeneratedAt
        }
      });
      
    } catch (error) {
      console.error('Error retrieving inference trace:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve inference trace',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Regenerate recommendation (useful for testing or rule updates)
   * PUT /api/inference/:sessionId/regenerate
   */
  static async regenerateRecommendation(req, res) {
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
          message: 'Session not found or not completed'
        });
      }
      
      // Initialize inference engine
      const engine = new RuleEngine();
      
      // Convert Map to plain object for inference
      const answers = {};
      for (const [key, value] of session.answers.entries()) {
        answers[key] = value;
      }
      
      // Generate new recommendation
      const result = await engine.infer(session.domainId._id, answers, sessionId);
      
      // Initialize hardened Groq refinement service
      const llmService = new HardenedGroqService();
      
      // Refine recommendation with LLM if enabled
      let refinedRecommendation = null;
      const useLLM = process.env.ENABLE_LLM_REFINEMENT !== 'false';
      
      if (useLLM) {
        try {
          console.log('🎨 Starting Groq refinement for regenerated recommendation...');
          refinedRecommendation = await llmService.refineRecommendation(
            result.recommendation, 
            result.trace, 
            session.userProfile || {}, 
            session.domainId.name, 
            sessionId
          );
          console.log('✅ Groq refinement completed for regeneration');
        } catch (error) {
          console.error('❌ Groq refinement failed during regeneration:', error.message);
          refinedRecommendation = null;
        }
      }
      
      // Store previous recommendation for comparison (optional)
      const previousRecommendation = session.recommendation;
      
      // Update session with new recommendation
      session.recommendation = result.recommendation;
      session.recommendationGeneratedAt = new Date();
      session.recommendationMetadata = {
        confidence: result.metadata.confidence,
        rulesEvaluated: result.metadata.rulesEvaluated,
        rulesMatched: result.metadata.rulesMatched,
        appliedRules: result.recommendation.metadata.appliedRules.map(r => ({
          name: r.name,
          priority: r.priority,
          contribution: r.contribution
        })),
        regenerated: true,
        previousConfidence: previousRecommendation?.metadata?.confidence,
        llmRefined: !!refinedRecommendation,
        llmFallback: refinedRecommendation?.llmStatus !== 'success'
      };
      session.inferenceTrace = result.trace;
      
      // Store refined recommendation if available
      if (refinedRecommendation) {
        session.refinedRecommendation = refinedRecommendation;
      }
      session.inferenceTrace = result.trace;
      
      await session.save();
      
      // Log the regeneration
      await AuditLog.create({
        userId,
        event: 'recommendation_regenerated',
        details: {
          sessionId: session._id,
          domainId: session.domainId._id,
          newConfidence: result.metadata.confidence,
          previousConfidence: previousRecommendation?.metadata?.confidence
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(200).json({
        success: true,
        message: 'Recommendation regenerated successfully',
        data: {
          recommendation: result.recommendation,
          confidence: result.metadata.confidence,
          metadata: {
            rulesEvaluated: result.metadata.rulesEvaluated,
            rulesMatched: result.metadata.rulesMatched,
            regenerated: true,
            domainName: session.domainId.name
          }
        }
      });
      
    } catch (error) {
      console.error('Error regenerating recommendation:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  /**
   * Get user's recommendation history
   * GET /api/inference/history
   */
  static async getRecommendationHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const sessions = await Session.find({
        userId,
        recommendation: { $exists: true }
      })
      .populate('domainId', 'name description')
      .select('domainId recommendation recommendationGeneratedAt recommendationMetadata')
      .sort({ recommendationGeneratedAt: -1 })
      .skip(skip)
      .limit(limit);
      
      const total = await Session.countDocuments({
        userId,
        recommendation: { $exists: true }
      });
      
      res.status(200).json({
        success: true,
        message: 'Recommendation history retrieved successfully',
        data: {
          recommendations: sessions.map(session => ({
            sessionId: session._id,
            domain: {
              id: session.domainId._id,
              name: session.domainId.name,
              description: session.domainId.description
            },
            recommendation: session.recommendation,
            generatedAt: session.recommendationGeneratedAt,
            confidence: session.recommendationMetadata?.confidence || 'unknown'
          })),
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: sessions.length,
            totalRecords: total
          }
        }
      });
      
    } catch (error) {
      console.error('Error retrieving recommendation history:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommendation history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = InferenceController;