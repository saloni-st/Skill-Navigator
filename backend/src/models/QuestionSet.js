const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  text: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['single_choice', 'multiple_choice', 'scale', 'text', 'number'],
    required: true
  },
  key: {
    type: String
  },
  options: [{
    value: String,
    label: String
  }],
  required: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number
  }
});

const questionSetSchema = new mongoose.Schema({
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  questions: [questionSchema],
  version: {
    type: String,
    default: '1.0.0'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuestionSet', questionSetSchema);