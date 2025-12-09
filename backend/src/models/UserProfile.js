const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Basic Information
  basicInfo: {
    fullName: { type: String, required: true },
    age: { type: Number, min: 16, max: 100 },
    location: { type: String },
    timezone: { type: String, default: 'UTC' }
  },

  // Educational Background
  education: {
    highestDegree: {
      type: String,
      enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other'],
      default: 'bachelor'
    },
    fieldOfStudy: { type: String },
    institution: { type: String },
    graduationYear: { type: Number },
    currentlyStudying: { type: Boolean, default: false },
    certifications: [{ 
      name: String, 
      issuer: String, 
      year: Number 
    }]
  },

  // Professional Experience
  experience: {
    totalYears: { type: Number, default: 0 },
    currentRole: { type: String },
    industry: { type: String },
    companySize: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise']
    },
    workType: {
      type: String,
      enum: ['full_time', 'part_time', 'freelance', 'student', 'unemployed']
    }
  },

  // Technical Skills
  technicalSkills: {
    programmingLanguages: [{ 
      language: String, 
      proficiency: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
      } 
    }],
    frameworks: [{ 
      framework: String, 
      proficiency: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
      } 
    }],
    tools: [{ 
      tool: String, 
      proficiency: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
      } 
    }],
    databases: [String],
    cloudPlatforms: [String]
  },

  // Learning Preferences
  learningPreferences: {
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'hands_on', 'reading', 'mixed'],
      default: 'mixed'
    },
    weeklyTimeCommitment: { 
      type: Number, 
      min: 1, 
      max: 40, 
      default: 10 
    },
    preferredSchedule: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
      default: 'flexible'
    },
    resourceTypes: [{
      type: String,
      enum: ['videos', 'tutorials', 'books', 'documentation', 'projects', 'bootcamps']
    }],
    difficultyPreference: {
      type: String,
      enum: ['gradual', 'challenging', 'mixed'],
      default: 'gradual'
    }
  },

  // Career Goals
  careerGoals: {
    shortTermGoals: [String], // 6 months
    longTermGoals: [String],  // 1-2 years
    targetRoles: [String],
    targetIndustries: [String],
    workLocationPreference: {
      type: String,
      enum: ['remote', 'office', 'hybrid', 'flexible'],
      default: 'flexible'
    }
  },

  // Interests & Motivations
  interests: {
    primaryInterests: [String],
    motivations: [{
      type: String,
      enum: ['problem-solving', 'creating', 'helping-others', 'innovation', 
             'financial-stability', 'work-flexibility', 'recognition', 'learning',
             'leadership', 'entrepreneurship', 'career_growth', 'salary_increase', 
             'skill_development', 'job_security', 'passion', 'problem_solving', 'helping_others']
    }],
    challengeAreas: [String],
    inspirations: [String]
  },

  // Current Status
  currentStatus: {
    isProfileComplete: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    profileCompletionPercentage: { type: Number, default: 0 },
    onboardingStep: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

// Calculate profile completion percentage
userProfileSchema.methods.calculateCompletionPercentage = function() {
  let completedFields = 0;
  let totalFields = 10; // Simplified to 10 essential fields

  // Basic Information (4 fields)
  if (this.basicInfo.fullName) completedFields++;
  if (this.basicInfo.age) completedFields++;
  if (this.basicInfo.location) completedFields++;
  
  // Education (2 fields)
  if (this.education.highestDegree) completedFields++;
  if (this.education.fieldOfStudy) completedFields++;
  
  // Experience (2 fields)
  if (this.experience.totalYears !== undefined) completedFields++;
  if (this.experience.currentRole) completedFields++;
  
  // Technical Skills (1 field)
  if (this.technicalSkills.programmingLanguages.length > 0) completedFields++;
  
  // Career Goals (2 fields)
  if (this.careerGoals.targetRoles.length > 0) completedFields++;
  if (this.careerGoals.targetIndustries.length > 0) completedFields++;

  this.currentStatus.profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
  this.currentStatus.isProfileComplete = this.currentStatus.profileCompletionPercentage >= 80;
  return this.currentStatus.profileCompletionPercentage;
};

// Create comprehensive profile for LLM
userProfileSchema.methods.getLLMProfile = function() {
  return {
    basicInfo: this.basicInfo,
    education: {
      degree: this.education.highestDegree,
      field: this.education.fieldOfStudy,
      year: this.education.graduationYear,
      certifications: this.education.certifications.map(c => c.name)
    },
    experience: {
      years: this.experience.totalYears,
      role: this.experience.currentRole,
      industry: this.experience.industry,
      workType: this.experience.workType
    },
    technicalSkills: {
      languages: this.technicalSkills.programmingLanguages.map(l => `${l.language} (${l.proficiency})`),
      frameworks: this.technicalSkills.frameworks.map(f => `${f.framework} (${f.proficiency})`),
      tools: this.technicalSkills.tools.map(t => `${t.tool} (${t.proficiency})`),
      databases: this.technicalSkills.databases,
      cloud: this.technicalSkills.cloudPlatforms
    },
    learningProfile: {
      style: this.learningPreferences.preferredLearningStyle,
      timeCommitment: this.learningPreferences.weeklyTimeCommitment,
      schedule: this.learningPreferences.preferredSchedule,
      resourceTypes: this.learningPreferences.resourceTypes,
      difficulty: this.learningPreferences.difficultyPreference
    },
    goals: {
      shortTerm: this.careerGoals.shortTermGoals,
      longTerm: this.careerGoals.longTermGoals,
      targetRoles: this.careerGoals.targetRoles,
      industries: this.careerGoals.targetIndustries,
      workStyle: this.careerGoals.workLocationPreference
    },
    interests: {
      primary: this.interests.primaryInterests,
      motivations: this.interests.motivations,
      challenges: this.interests.challengeAreas
    }
  };
};

module.exports = mongoose.model('UserProfile', userProfileSchema);