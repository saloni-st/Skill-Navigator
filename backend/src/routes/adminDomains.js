const express = require('express');
const router = express.Router();
const {
  createDomainWithQuestions,
  getAdminDomains,
  regenerateDomainQuestions,
  deleteDomain
} = require('../controllers/adminDomainController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   POST /api/admin/domains
// @desc    Create new domain with LLM-generated questions
// @access  Admin
router.post('/', authMiddleware, adminMiddleware, createDomainWithQuestions);

// @route   GET /api/admin/domains
// @desc    Get all domains with stats (admin view)
// @access  Admin
router.get('/', authMiddleware, adminMiddleware, getAdminDomains);

// @route   POST /api/admin/domains/:id/regenerate-questions
// @desc    Regenerate questions for existing domain using LLM
// @access  Admin
router.post('/:id/regenerate-questions', authMiddleware, adminMiddleware, regenerateDomainQuestions);

// @route   DELETE /api/admin/domains/:id
// @desc    Delete domain and all associated data
// @access  Admin
router.delete('/:id', authMiddleware, adminMiddleware, deleteDomain);

module.exports = router;