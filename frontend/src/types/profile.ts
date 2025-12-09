// User Profile Types
export interface UserProfile {
  _id: string;
  userId: string;
  basicInfo: {
    fullName: string;
    name: string;
    email: string;
    age?: number;
    location?: string;
    timezone?: string;
    currentRole?: string;
    experience?: string;
  };
  education: {
    highestDegree: 'high_school' | 'diploma' | 'bachelor' | 'master' | 'phd' | 'other';
    fieldOfStudy?: string;
    graduationYear?: number;
    currentlyStudying?: boolean;
    education?: Array<{
      degree: string;
      institution: string;
      field: string;
      year: string;
      gpa?: string;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
      year?: string;
      url?: string;
    }>;
    additionalInfo?: string;
  };
  experience: {
    totalYears: number;
    currentRole?: string;
    industry?: string;
    companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    workType?: 'full_time' | 'part_time' | 'freelance' | 'student' | 'unemployed';
    workExperience?: Array<{
      company: string;
      position: string;
      duration: string;
      description: string;
      technologies?: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string;
      url?: string;
      duration?: string;
    }>;
    achievements?: string;
  };
  technicalSkills: {
    programmingLanguages: Array<{
      language?: string;
      name: string;
      proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    }>;
    frameworks: Array<{
      framework?: string;
      name: string;
      proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    }>;
    databases: Array<{
      name: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    }>;
    cloudPlatforms: Array<{
      name: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    }>;
    tools: Array<{
      tool?: string;
      name: string;
      proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    }>;
    otherSkills: string[];
  };
  learningPreferences: {
    preferredLearningStyle?: 'visual' | 'auditory' | 'hands_on' | 'reading' | 'mixed';
    learningStyle: string[];
    preferredFormats: string[];
    timeCommitment: string;
    weeklyTimeCommitment: number;
    difficultyPreference: string;
    pacePreference: string;
    feedbackStyle: string;
    practicalVsTheory: string;
    collaborationPreference: string;
    preferredSchedule: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
    resourceTypes: Array<'videos' | 'articles' | 'books' | 'courses' | 'bootcamps'>;
    additionalPreferences?: string;
  };
  careerGoals: {
    currentCareerStage: string;
    desiredRole: string;
    careerObjectives: string[];
    targetIndustries: string[];
    timeFrame: string;
    specificGoals: string;
    challenges: string;
    skillGaps: string;
    mentorshipInterest: string;
    networkingGoals: string;
    shortTermGoals: string[];
    longTermGoals: string[];
    targetRoles: string[];
    salaryExpectations?: {
      current?: number;
      target?: number;
      timeframe?: string;
    };
    workLocationPreference: 'remote' | 'office' | 'hybrid' | 'flexible';
  };
  interests: {
    technicalInterests: string[];
    industryInterests: string[];
    workEnvironmentPreference: string;
    motivations: string[];
    personalityTraits: string[];
    hobbiesAndInterests: string;
    learningMotivation: string;
    workLifeBalance: string;
    additionalInfo?: string;
    primaryInterests?: string[];
    challengeAreas?: string[];
    inspirations?: string[];
  };
  currentStatus: {
    isProfileComplete: boolean;
    lastUpdated: string;
    profileCompletionPercentage: number;
    onboardingStep: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  basicInfo?: Partial<UserProfile['basicInfo']>;
  education?: Partial<UserProfile['education']>;
  experience?: Partial<UserProfile['experience']>;
  technicalSkills?: Partial<UserProfile['technicalSkills']>;
  learningPreferences?: Partial<UserProfile['learningPreferences']>;
  careerGoals?: Partial<UserProfile['careerGoals']>;
  interests?: Partial<UserProfile['interests']>;
}

export interface ProfileStepProps {
  data: ProfileFormData;
  onNext: (stepData: any) => void;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsProfile: boolean;
  hasCompleteProfile: boolean;
  completionPercentage: number;
  fetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: ProfileFormData) => Promise<void>;
  updateStep: (step: number, data: any) => Promise<void>;
}