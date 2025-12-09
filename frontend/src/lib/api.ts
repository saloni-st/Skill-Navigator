import {
  ApiResponse,
  Domain,
  DomainWithQuestions,
  Question,
  Session,
  SessionCreate,
  SessionDraft,
  SessionSubmit,
  Result,
  InferenceTrace,
  Feedback,
  AdminStats,
  AuditLog,
  PaginatedResponse,
  User,
  UserProfile,
  EnhancedResult,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('skillnavigator_token');
  console.log('🔑 Auth token for API request:', token ? `${token.substring(0, 20)}...` : 'No token found');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();
    
    console.log(`📡 API Response for ${endpoint}:`, {
      status: response.status,
      success: data.success,
      data: data.data || data,
      message: data.message
    });
    
    // Handle token expiration
    if (response.status === 401 && data.message?.includes('expired')) {
      localStorage.removeItem('skillnavigator_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    return { ...data, status: response.status };
  } catch (error) {
    console.error('❌ API request error for', endpoint, ':', error);
    throw error;
  }
};

// Domain API calls
export const domainsAPI = {
  getAll: (): Promise<ApiResponse<{ domains: Domain[] }>> => apiRequest('/api/domains'),
  getById: (id: string): Promise<ApiResponse<{ domain: DomainWithQuestions }>> => apiRequest(`/api/domains/${id}`),
  getQuestions: (id: string): Promise<ApiResponse<{ questions: Question[] }>> => apiRequest(`/api/domains/${id}/questions`),
};

// Questionnaire/Session API calls
export const questionnaireAPI = {
  // Legacy questionnaire endpoints - map to sessions
  getQuestions: (domainId: string): Promise<ApiResponse<{ questions: Question[] }>> => 
    apiRequest(`/api/domains/${domainId}/questions`),
  submitAnswers: (sessionId: string, answers: Record<string, any>): Promise<ApiResponse<Session>> => 
    apiRequest(`/api/sessions/${sessionId}/submit`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    }),
};

// Sessions API calls
export const sessionsAPI = {
  create: (domainId: string): Promise<ApiResponse<any>> => 
    apiRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ domainId }),
    }),
  getById: (sessionId: string): Promise<ApiResponse<{ session: Session }>> => 
    apiRequest(`/api/sessions/${sessionId}`),
  getUserSessions: (): Promise<ApiResponse<{ sessions: Session[] }>> => 
    apiRequest('/api/sessions'),
  saveDraft: (sessionData: SessionDraft): Promise<ApiResponse<Session>> => 
    apiRequest('/api/sessions/draft', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  submit: (sessionId: string, answers: Record<string, any>): Promise<ApiResponse<Session>> => 
    apiRequest(`/api/sessions/${sessionId}/submit`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    }),
  deleteSession: (sessionId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
};

// User profile API calls
export const userAPI = {
  getProfile: (): Promise<ApiResponse<{ user: User }>> => 
    apiRequest('/api/auth/me'),
  updateProfile: (profileData: Partial<UserProfile>): Promise<ApiResponse<{ user: User }>> => 
    apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// Admin API calls
export const adminAPI = {
  getStats: (): Promise<ApiResponse<{ stats: AdminStats }>> => 
    apiRequest('/api/admin/stats'),
  getUsers: (page = 1, limit = 10): Promise<ApiResponse<{ users: User[], pagination: any }>> => 
    apiRequest(`/api/admin/users?page=${page}&limit=${limit}`),
  updateUser: (userId: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => 
    apiRequest(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  deleteUser: (userId: string): Promise<ApiResponse<any>> => 
    apiRequest(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    }),
  getAuditLogs: (page = 1, limit = 20): Promise<PaginatedResponse<AuditLog>> => 
    apiRequest(`/api/admin/audit-logs?page=${page}&limit=${limit}`),
  getDomains: (): Promise<ApiResponse<{ domains: Domain[] }>> =>
    apiRequest('/api/admin/domains'),
  createDomain: (domainData: { name: string; description: string; targetAudience?: string }): Promise<ApiResponse<any>> =>
    apiRequest('/api/admin/domains', {
      method: 'POST',
      body: JSON.stringify(domainData),
    }),
  deleteDomain: (domainId: string): Promise<ApiResponse<any>> =>
    apiRequest(`/api/admin/domains/${domainId}`, {
      method: 'DELETE',
    }),
  regenerateQuestions: (domainId: string, targetAudience?: string): Promise<ApiResponse<any>> =>
    apiRequest(`/api/admin/domains/${domainId}/regenerate-questions`, {
      method: 'POST',
      body: JSON.stringify({ targetAudience }),
    }),
  updateDomain: (domainId: string, data: any): Promise<ApiResponse<{ domain: Domain }>> =>
    apiRequest(`/api/admin/domains/${domainId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getRules: (domainId?: string): Promise<ApiResponse<{ rules: any[] }>> =>
    apiRequest(`/api/admin/rules${domainId ? `?domainId=${domainId}` : ''}`),
  createRule: (ruleData: any): Promise<ApiResponse<{ rule: any }>> =>
    apiRequest('/api/admin/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    }),
  updateRule: (ruleId: string, ruleData: any): Promise<ApiResponse<{ rule: any }>> =>
    apiRequest(`/api/admin/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    }),
  deleteRule: (ruleId: string): Promise<ApiResponse<any>> =>
    apiRequest(`/api/admin/rules/${ruleId}`, {
      method: 'DELETE',
    }),
  testRule: (ruleId: string, testData: any): Promise<ApiResponse<{ result: any }>> =>
    apiRequest(`/api/admin/rules/${ruleId}/test`, {
      method: 'POST',
      body: JSON.stringify(testData),
    }),
  // Assessment Configuration
  getAssessmentConfig: (): Promise<ApiResponse<any>> =>
    apiRequest('/api/admin/assessment-config'),
  // Cache Management
  reloadCache: (): Promise<ApiResponse<any>> =>
    apiRequest('/api/admin/reload-cache', {
      method: 'POST',
    }),
  // Domain Enhancement
  enhanceDomainQuestions: (domainId: string, targetQuestionCount?: number): Promise<ApiResponse<any>> =>
    apiRequest(`/api/admin/domains/${domainId}/enhance-questions`, {
      method: 'PUT',
      body: JSON.stringify({ targetQuestionCount }),
    }),
  bulkEnhanceDomains: (targetQuestionCount?: number): Promise<ApiResponse<any>> =>
    apiRequest('/api/admin/domains/bulk-enhance', {
      method: 'POST',
      body: JSON.stringify({ targetQuestionCount }),
    }),
};

// Inference API calls
export const inferenceAPI = {
  generateRecommendation: (sessionId: string): Promise<ApiResponse<{ recommendation: any }>> => 
    apiRequest(`/api/inference/${sessionId}/recommend`, { method: 'POST' }),
  getRecommendation: (sessionId: string): Promise<ApiResponse<{ recommendation: any }>> => 
    apiRequest(`/api/inference/${sessionId}/recommendation`),
  getTrace: (sessionId: string): Promise<ApiResponse<{ trace: InferenceTrace }>> => 
    apiRequest(`/api/inference/${sessionId}/trace`),
  regenerate: (sessionId: string): Promise<ApiResponse<{ recommendation: any }>> => 
    apiRequest(`/api/inference/${sessionId}/regenerate`, { method: 'PUT' }),
};

// Results API calls
export const resultsAPI = {
  getCompleteResult: (sessionId: string): Promise<ApiResponse<EnhancedResult>> => 
    apiRequest(`/api/results/${sessionId}`),
  saveResult: (sessionId: string, data: { title?: string; notes?: string }): Promise<ApiResponse<any>> => 
    apiRequest(`/api/results/${sessionId}/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  downloadPDF: (sessionId: string): Promise<Blob> => 
    apiRequest(`/api/results/${sessionId}/pdf`),
  submitFeedback: (sessionId: string, feedback: Feedback): Promise<ApiResponse<any>> => 
    apiRequest(`/api/results/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),
  retryLlmRefinement: (sessionId: string): Promise<ApiResponse<any>> =>
    apiRequest(`/api/results/${sessionId}/retry-llm`, {
      method: 'POST',
    }),
  // Test endpoint without authentication
  getCompleteResultTest: (sessionId: string): Promise<ApiResponse<EnhancedResult>> => 
    apiRequest(`/api/results/test/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json'
        // No auth headers for test endpoint
      }
    })
};

// User Profile API
export const profileAPI = {
  getProfile: (): Promise<ApiResponse<any>> =>
    apiRequest('/api/profile'),
  createOrUpdateProfile: (profileData: any): Promise<ApiResponse<any>> =>
    apiRequest('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),
  updateProfileStep: (step: number, data: any): Promise<ApiResponse<any>> =>
    apiRequest('/api/profile/step', {
      method: 'PATCH',
      body: JSON.stringify({ step, data }),
    }),
  getProfileStatus: (): Promise<ApiResponse<any>> =>
    apiRequest('/api/profile/status'),
  getLLMFormattedProfile: (): Promise<ApiResponse<any>> =>
    apiRequest('/api/profile/llm-format'),
};



// Health check
export const healthAPI = {
  check: (): Promise<ApiResponse<{ status: string; timestamp: string }>> => 
    apiRequest('/health'),
};

const api = {
  domainsAPI,
  questionnaireAPI,
  sessionsAPI,
  inferenceAPI,
  resultsAPI,
  userAPI,
  adminAPI,
  profileAPI,
  healthAPI,
};

export default api;