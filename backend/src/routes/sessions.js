const express = require('express');
const {
  startSession,
  saveDraftSession,
  submitFinalAnswers,
  getSession,
  getUserSessions,
  deleteSession,
} = require('../controllers/sessionController');
const { submitAnswersSimple } = require('../controllers/submitAnswersSimple');
const { authMiddleware, auditMiddleware } = require('../middleware/auth');

const router = express.Router();

// All session routes require authentication
router.use(authMiddleware);

// @route   POST /api/sessions
// @desc    Start a new session
// @access  Private
router.post('/', auditMiddleware('session_started'), startSession);

// All session routes require authentication
router.use(authMiddleware);

// @route   POST /api/sessions
// @desc    Start a new session
// @access  Private
router.post('/', auditMiddleware('session_started'), startSession);

// @route   POST /api/sessions/draft
// @desc    Save session draft (partial answers)
// @access  Private
router.post('/draft', auditMiddleware('session_draft_saved'), saveDraftSession);

// @route   PUT /api/sessions/:id/submit
// @desc    Submit final answers and start processing
// @access  Private
router.put('/:id/submit', auditMiddleware('answers_submitted'), submitFinalAnswers);

// @route   GET /api/sessions
// @desc    Get user's session history
// @access  Private
router.get('/', auditMiddleware('sessions_viewed'), getUserSessions);

// @route   GET /api/sessions/:id
// @desc    Get specific session by ID
// @access  Private
router.get('/:id', auditMiddleware('session_viewed'), getSession);

// @route   DELETE /api/sessions/:id
// @desc    Delete a session
// @access  Private
router.delete('/:id', auditMiddleware('session_deleted'), deleteSession);

module.exports = router;