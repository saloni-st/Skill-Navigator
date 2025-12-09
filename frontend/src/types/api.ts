// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  status: number;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profile: UserProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  education: 'high_school' | 'bachelors' | 'masters' | 'phd' | 'bootcamp' | 'self_taught';
  experienceYears: number;
  weeklyHours: number;
  interests: string[];
}

// Domain Types
export interface Domain {
  id: string;
  name: string;
  description: string;
  questionCount?: number;
  ruleCount?: number;
  version?: string;
  createdAt: string;
  active: boolean;
  questionSetId?: string;
}

export interface DomainWithQuestions extends Domain {
  questions: Question[];
}

// Question Types
export interface Question {
  id: string;
  text: string;
  type: 'single-select' | 'multi-select' | 'text' | 'number' | 'range';
  options?: QuestionOption[];
  required: boolean;
  order: number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface QuestionOption {
  value: string;
  label: string;
  weight?: number;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  domainId: string;
  domain?: Domain;
  questionSetId: string;
  questionSet?: {
    questions: Question[];
    version: string;
  };
  answers: Record<string, any>;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'error' | 'started' | 'inference_complete';
  processingStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionCreate {
  domainId: string;
}

export interface SessionDraft {
  sessionId: string;
  answers: Record<string, any>;
}

export interface SessionSubmit {
  answers: Record<string, any>;
}

// Result Types
export interface Result {
  sessionId: string;
  userId: string;
  domainId: string;
  baseRecommendation: BaseRecommendation;
  finalRecommendation: FinalRecommendation;
  explainability: Explainability;
  createdAt: string;
  updatedAt: string;
}

export interface BaseRecommendation {
  summary: string;
  confidence: number;
  recommendedPath: string[];
  estimatedTimeframe: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ruleMatches: RuleMatch[];
}

export interface FinalRecommendation {
  summary: string;
  roadmap: RoadmapStep[];
  resources: Resource[];
  nextSteps: string[];
  personalizedNotes: string;
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  description: string;
  skills: string[];
  milestones: string[];
  resources?: Resource[];
}

export interface Resource {
  type: 'course' | 'book' | 'tutorial' | 'practice' | 'certification';
  title: string;
  url?: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  free?: boolean;
}

export interface Explainability {
  factorsConsidered: string[];
  ruleApplications: RuleApplication[];
  confidenceBreakdown: {
    education: number;
    experience: number;
    timeCommitment: number;
    goals: number;
    overall: number;
  };
  assumptions: string[];
  alternatives: Alternative[];
}

// Enhanced Result Types for Phase 4
export interface EnhancedResult {
  sessionId: string;
  session: {
    id: string;
    domain: {
      id: string;
      name: string;
    };
    createdAt: string;
    completedAt: string;
  };
  baseRecommendation: {
    skills: string[];
    resources: string[];
    projects: string[];
    weeklyPlan?: WeeklyPlan;
    assessment?: Assessment;
    careerPath?: CareerPath;
    milestones?: Milestone[];
    realTimeResources?: any;
    learningRecommendations?: LearningRecommendation[];
    summary: string;
    metadata?: {
      confidence?: number;
      reasoning?: string[];
      appliedRules?: any[];
    };
  } | null;
  llmRecommendation?: {
    roadmap: any;
    llmStatus: string;
  } | null;
  confidence: {
    score: number;
    level: string;
    coverage: number;
    rulesMatched: number;
    rulesEvaluated: number;
  };
  confidenceBreakdown: any;
  trace: InferenceTraceStep[];
  llmStatus: 'success' | 'failed' | 'timeout' | 'not_used';
  processing: ProcessingInfo;
  actions: {
    canSave: boolean;
    canDownload: boolean;
    canClarify: boolean;
    canRate: boolean;
  };
}

export interface WeeklyPlan {
  [weekKey: string]: {
    focus: string;
    topics: string[];
    dailySchedule: {
      [day: string]: string;
    };
    resources: Resource[];
    project: string;
    goals: string[];
  };
}

export interface Assessment {
  currentLevel: string;
  strengths: string[];
  improvementAreas: string[];
}

export interface CareerPath {
  nextRole: string;
  salaryRange: string;
  requiredSkills: string[];
}

export interface Milestone {
  week: number;
  project: string;
  skills: string[];
}

export interface LearningRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'book' | 'tutorial' | 'practice' | 'certification';
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
  provider?: string;
  rating?: number;
  price?: string;
  language?: string;
}

export interface BaseRecommendation {
  summary: string;
  recommendations: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeframe: string;
  recommendedPath: string[];
  ruleMatches: RuleMatch[];
}

export interface LlmRecommendation {
  roadmap: any;
  llmStatus: string;
}

export interface ConfidenceBreakdown {
  totalPositive: number;
  coverage: number;
  breakdown: ConfidenceRuleScore[];
}

export interface ConfidenceRuleScore {
  ruleId: string;
  ruleName: string;
  score: number;
  weight: number;
  matched: boolean;
}

export interface InferenceTraceStep {
  step: string;
  description: string;
  result: any;
  duration?: number;
}

export interface ProcessingInfo {
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  stepDetails: ProcessingStep[];
}

export interface ProcessingStep {
  step: number;
  name: string;
  status: 'completed' | 'failed' | 'skipped' | 'in_progress';
  duration: string;
}

export interface RuleMatch {
  ruleId: string;
  description: string;
  weight: number;
  matched: boolean;
  condition: string;
  recommendation: string;
}

export interface RuleApplication {
  ruleId: string;
  ruleName: string;
  applied: boolean;
  reason: string;
  impact: string;
  weight: number;
}

export interface Alternative {
  path: string;
  reason: string;
  suitableIf: string[];
}

// Inference Types
export interface InferenceTrace {
  sessionId: string;
  steps: InferenceStep[];
  duration: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

export interface InferenceStep {
  step: string;
  description: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
}

// Feedback Types
export interface Feedback {
  sessionId: string;
  userId: string;
  rating: number; // 1-5
  helpful: boolean;
  accuracy: number; // 1-5
  relevance: number; // 1-5
  comments?: string;
  improvements?: string[];
  wouldRecommend: boolean;
  createdAt: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  topDomains: DomainStats[];
  recentActivity: ActivityLog[];
}

export interface DomainStats {
  domainId: string;
  domainName: string;
  sessionCount: number;
  completionRate: number;
  averageRating: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Error Types
export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  code?: string;
  status: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}