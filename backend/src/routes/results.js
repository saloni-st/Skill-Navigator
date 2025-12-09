const express = require('express');
const { param, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const ResultController = require('../controllers/resultController');

const router = express.Router();

/**
 * Test endpoint for development - NO AUTH REQUIRED
 * GET /api/results/test/:sessionId
 */
router.get('/test/:sessionId', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], ResultController.getCompleteResultTest);

/**
 * All other routes require authentication
 */
router.use(authMiddleware);

/**
 * Get complete result with roadmap and explainability
 * GET /api/results/:sessionId
 */
router.get('/:sessionId', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], ResultController.getCompleteResult);

/**
 * Save result (bookmark for user)
 * POST /api/results/:sessionId/save
 */
router.post('/:sessionId/save', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1-100 characters'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], ResultController.saveResult);

/**
 * Generate PDF download
 * GET /api/results/:sessionId/pdf
 */
router.get('/:sessionId/pdf', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], ResultController.generatePDF);

/**
 * Ask clarifying question using LLM
 * POST /api/results/:sessionId/clarify
 */
router.post('/:sessionId/clarify', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  body('question')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Question must be between 5-500 characters')
], ResultController.askClarifyingQuestion);

/**
 * Rate the recommendation
 * POST /api/results/:sessionId/rate
 */
router.post('/:sessionId/rate', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1-5'),
  body('feedback')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters'),
  body('aspects')
    .optional()
    .isArray()
    .withMessage('Aspects must be an array'),
  body('aspects.*')
    .optional()
    .isIn(['accuracy', 'clarity', 'completeness', 'relevance', 'timeline'])
    .withMessage('Invalid aspect value')
], ResultController.rateRecommendation);

/**
 * Retry LLM refinement
 * POST /api/results/:sessionId/retry-llm
 */
router.post('/:sessionId/retry-llm', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], ResultController.retryLlmRefinement);

/**
 * Get user's saved results
 * GET /api/results/saved
 */
router.get('/saved', ResultController.getSavedResults);

/**
 * Get processing status for real-time updates
 * GET /api/results/:sessionId/status
 */
router.get('/:sessionId/status', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], ResultController.getProcessingStatus);

module.exports = router;