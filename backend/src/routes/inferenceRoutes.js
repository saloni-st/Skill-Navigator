const express = require('express');
const { param, query } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const InferenceController = require('../controllers/inferenceController');

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * Generate recommendation for a session
 * POST /api/inference/:sessionId/recommend
 */
router.post('/:sessionId/recommend', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], InferenceController.generateRecommendation);

/**
 * Get existing recommendation for a session
 * GET /api/inference/:sessionId/recommendation
 */
router.get('/:sessionId/recommendation', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], InferenceController.getRecommendation);

/**
 * Get inference trace for debugging
 * GET /api/inference/:sessionId/trace
 */
router.get('/:sessionId/trace', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], InferenceController.getInferenceTrace);

/**
 * Regenerate recommendation
 * PUT /api/inference/:sessionId/regenerate
 */
router.put('/:sessionId/regenerate', [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
], InferenceController.regenerateRecommendation);

/**
 * Get user's recommendation history
 * GET /api/inference/history
 */
router.get('/history', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], InferenceController.getRecommendationHistory);

module.exports = router;