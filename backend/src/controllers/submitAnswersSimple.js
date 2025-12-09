// Simple submit answers method for testing
const { Session, AuditLog } = require('../models');

const submitAnswersSimple = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { answers } = req.body;
    
    console.log('Submitting answers for session:', sessionId);
    console.log('Answers received:', answers);

    // Find the session
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user.id
    }).populate('domainId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('Session found:', session._id);

    // Convert answers to Map
    const answersMap = new Map();
    for (const [key, value] of Object.entries(answers)) {
      answersMap.set(key, value);
    }

    // Update session
    session.answers = answersMap;
    session.status = 'completed';
    await session.save();

    console.log('Session updated successfully');

    // Log the submission
    await AuditLog.create({
      userId: req.user.id,
      event: 'answers_submitted',
      details: {
        sessionId: session._id,
        domainId: session.domainId._id,
        answersCount: Object.keys(answers).length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Answers submitted successfully',
      data: {
        sessionId: session._id,
        status: session.status,
        answersSubmitted: Object.keys(answers).length,
        domain: {
          id: session.domainId._id,
          name: session.domainId.name
        }
      }
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answers',
      error: error.message
    });
  }
};

module.exports = { submitAnswersSimple };