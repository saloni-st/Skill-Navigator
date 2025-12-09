const express = require('express');
const {
  getDomains,
  getDomainById,
  getDomainQuestions,
} = require('../controllers/domainController');
const { authMiddleware, auditMiddleware, adminAuth } = require('../middleware/auth');

const router = express.Router();

// All domain routes require authentication
router.use(authMiddleware);

// @route   GET /api/domains
// @desc    Get all available domains
// @access  Private
router.get('/', auditMiddleware('domains_viewed'), getDomains);

// @route   GET /api/domains/:id
// @desc    Get domain by ID with question set
// @access  Private
router.get('/:id', auditMiddleware('domain_detail_viewed'), getDomainById);

// @route   GET /api/domains/:id/questions
// @desc    Get domain question set only
// @access  Private
router.get('/:id/questions', auditMiddleware('domain_questions_viewed'), getDomainQuestions);

module.exports = router;