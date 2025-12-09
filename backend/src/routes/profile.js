const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  createOrUpdateProfile,
  updateProfileStep,
  getProfileStatus,
  getLLMFormattedProfile
} = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
router.get('/', getUserProfile);

// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
router.post('/', createOrUpdateProfile);

// @desc    Update profile step (for onboarding)
// @route   PATCH /api/profile/step
// @access  Private
router.patch('/step', updateProfileStep);

// @desc    Get profile completion status
// @route   GET /api/profile/status
// @access  Private
router.get('/status', getProfileStatus);

// @desc    Get LLM-formatted profile data
// @route   GET /api/profile/llm-format
// @access  Private
router.get('/llm-format', getLLMFormattedProfile);

module.exports = router;