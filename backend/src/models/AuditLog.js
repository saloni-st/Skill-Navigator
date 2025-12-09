const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  event: {
    type: String,
    required: [true, 'Event type is required'],
    enum: [
      'user_registered',
      'user_login',
      'profile_updated',
      'domains_viewed',
      'domain_detail_viewed',
      'domain_questions_viewed',
      'session_started',
      'session_draft_saved',
      'answers_submitted',
      'sessions_viewed',
      'session_viewed',
      'session_deleted',
      'inference_executed',
      'recommendation_generated',
      'recommendation_regenerated',
      'recommendation_viewed',
      'inference_trace_viewed',
      'llm_called',
      'result_viewed',
      'feedback_submitted',
      'rule_created',
      'rule_updated',
      'rule_deleted',
      'question_updated'
    ]
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for efficient querying
auditLogSchema.index({ sessionId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ event: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);