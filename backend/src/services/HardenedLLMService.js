const Groq = require('groq-sdk');
const { debugLoggers } = require('../utils/debugLogger');

/**
 * Hardened LLM Refinement Service - Phase 2 Implementation
 * 
 * This service implements robust LLM handling with:
 * - Safe prompt engineering with system instructions
 * - Input sanitization and context limits
 * - Validation, retry, and fallback mechanisms
 * - Graceful degradation when LLM fails
 */
class HardenedLLMService {
  constructor() {
    this.groq = null;
    this.logger = debugLoggers.llm;
    
    // Configuration constants
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY_BASE = 1000; // 1 second
    this.MAX_CONTEXT_LENGTH = 4000; // Characters
    this.MAX_USER_INPUT_LENGTH = 500; // Characters
    this.TIMEOUT_MS = 30000; // 30 seconds
    
    // System instructions - core safety guidelines
    this.SYSTEM_INSTRUCTIONS = {
      role: 'system',
      content: `You are a professional career guidance counselor. You MUST:
1. Provide learning recommendations based ONLY on the provided user profile and base recommendations
2. Structure responses in the exact JSON format requested
3. Never suggest illegal, harmful, or inappropriate content
4. Focus on legitimate learning resources and career paths
5. If uncertain about any detail, use the fallback data provided
6. Keep responses professional, helpful, and actionable
7. Do not hallucinate information not present in the input context`
    };
    
    this.initializeGroq();
  }

  initializeGroq() {
    try {
      if (!process.env.GROQ_API_KEY) {
        console.warn('⚠️  GROQ_API_KEY not found - LLM features will be disabled');
        return;
      }
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      this.logger.info('Groq client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Groq:', error.message);
      this.groq = null;
    }
  }

  /**
   * Main entry point for LLM refinement with full hardening
   * Implements Step A, B, and C of Phase 2
   */
  async refineRecommendation(session, baseRecommendation, inferenceTrace) {
    const operationId = `refine_${Date.now()}`;
    this.logger.info(`Starting LLM refinement`, { operationId, sessionId: session.id });

    // Early return if LLM unavailable
    if (!this.groq) {
      this.logger.warn('LLM unavailable - returning fallback', { operationId });
      return this.createFallbackResponse(baseRecommendation, inferenceTrace, 'llm_unavailable');
    }

    try {
      // Step B: Input Sanitization
      const sanitizedProfile = this.sanitizeUserProfile(session);
      const sanitizedTrace = this.sanitizeInferenceTrace(inferenceTrace);
      
      // Step A: Safe Prompt Engineering
      const prompt = this.buildSafePrompt(sanitizedProfile, baseRecommendation, sanitizedTrace);
      
      // Step C: Validation & Retry with exponential backoff
      const refinedResult = await this.executeWithRetry(prompt, operationId);
      
      // Step C: Response Validation
      const validatedResult = this.validateLLMResponse(refinedResult, baseRecommendation);
      
      this.logger.info('LLM refinement completed successfully', { 
        operationId,
        responseValid: !!validatedResult,
        fallback: false 
      });
      
      return validatedResult;
      
    } catch (error) {
      this.logger.error('LLM refinement failed - using fallback', { 
        operationId,
        error: error.message,
        errorType: error.name 
      });
      
      return this.createFallbackResponse(baseRecommendation, inferenceTrace, 'llm_error');
    }
  }

  /**
   * Step B: Sanitize user profile with strict limits
   * Prevents injection attacks and limits context size
   */
  sanitizeUserProfile(session) {
    const profile = session.profile || {};
    
    return {
      domain: this.sanitizeString(profile.domain, 50),
      experienceYears: this.sanitizeNumber(profile.experienceYears, 0, 50),
      educationLevel: this.sanitizeEnum(profile.educationLevel, [
        'high_school', 'bachelors', 'masters', 'phd', 'bootcamp', 'self_taught'
      ]),
      focusArea: this.sanitizeEnum(profile.focusArea, [
        'frontend', 'backend', 'fullstack', 'mobile', 'data', 'unsure'
      ]),
      careerGoal: this.sanitizeEnum(profile.careerGoal, [
        'job_switch', 'promotion', 'freelance', 'startup', 'learning'
      ]),
      weeklyCommitment: this.sanitizeNumber(profile.weeklyCommitment, 0, 60),
      learningStyle: this.sanitizeArray(profile.learningStyle, [
        'visual', 'hands_on', 'reading', 'video_courses', 'interactive'
      ])
    };
  }

  /**
   * Step B: Sanitize inference trace to prevent context overflow
   */
  sanitizeInferenceTrace(inferenceTrace) {
    if (!inferenceTrace) return { appliedRules: [], matchCount: 0 };
    
    return {
      appliedRules: (inferenceTrace.appliedRules || [])
        .slice(0, 10) // Limit to top 10 rules
        .map(rule => this.sanitizeString(rule, 100)),
      matchCount: this.sanitizeNumber(inferenceTrace.matchCount, 0, 1000)
    };
  }

  /**
   * Step A: Build safe, structured prompt with system instructions
   * Prevents injection and ensures consistent output format
   */
  buildSafePrompt(sanitizedProfile, baseRecommendation, sanitizedTrace) {
    const contextData = {
      profile: sanitizedProfile,
      baseSkills: (baseRecommendation.skills || []).slice(0, 10),
      baseResources: (baseRecommendation.resources || []).slice(0, 8),
      baseProjects: (baseRecommendation.projects || []).slice(0, 5),
      baseTimeline: this.sanitizeString(baseRecommendation.timeline, 200),
      appliedRules: sanitizedTrace.appliedRules,
      matchCount: sanitizedTrace.matchCount
    };

    const userPrompt = `Please refine this learning recommendation into a comprehensive roadmap.

**USER PROFILE:**
- Domain: ${contextData.profile.domain || 'Not specified'}
- Experience: ${this.getExperienceLabel(contextData.profile.experienceYears)}
- Education: ${this.getEducationLabel(contextData.profile.educationLevel)}
- Focus: ${this.getFocusLabel(contextData.profile.focusArea)}
- Goal: ${this.getCareerGoalLabel(contextData.profile.careerGoal)}
- Weekly Commitment: ${this.getCommitmentLabel(contextData.profile.weeklyCommitment)}
- Learning Style: ${this.getLearningStyleLabel(contextData.profile.learningStyle)}

**BASE RECOMMENDATIONS:**
Skills: ${contextData.baseSkills.join(', ')}
Resources: ${contextData.baseResources.join(', ')}
Projects: ${contextData.baseProjects.join(', ')}
Timeline: ${contextData.baseTimeline}

**INFERENCE DETAILS:**
Rules Applied: ${contextData.matchCount} matches from ${contextData.appliedRules.length} rules

**REQUIRED OUTPUT FORMAT:**
Return a JSON object with exactly these fields:
{
  "prioritySkills": "string - 3-5 key skills as bulleted list",
  "learningResources": "string - 4-6 specific resources as bulleted list", 
  "practiceProjects": "string - 2-4 hands-on projects as bulleted list",
  "timeline": "string - weekly breakdown for first 8-12 weeks",
  "whyThisPath": "string - 2-3 sentence explanation of the recommendation logic",
  "assumptions": "string - key assumptions made about user goals"
}

Enhance the base recommendations with specific details, actionable steps, and personalized guidance. Focus on practical, achievable goals.`;

    // Enforce context limits
    const truncatedPrompt = this.enforceContextLimits(userPrompt);
    
    return {
      messages: [
        this.SYSTEM_INSTRUCTIONS,
        {
          role: 'user',
          content: truncatedPrompt
        }
      ]
    };
  }

  /**
   * Step C: Execute LLM call with retry logic and circuit breaker pattern
   */
  async executeWithRetry(prompt, operationId) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.info(`LLM attempt ${attempt}/${this.MAX_RETRIES}`, { 
          operationId, 
          attempt 
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
        
        const response = await this.groq.chat.completions.create({
          messages: prompt.messages,
          model: process.env.GROQ_MODEL || 'deepseek-r1-distill-llama-70b',
          temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.3,
          max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 1000,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response?.choices?.[0]?.message?.content) {
          this.logger.info(`LLM call successful on attempt ${attempt}`, { operationId });
          return response.choices[0].message.content.trim();
        } else {
          throw new Error('Invalid response structure from LLM');
        }
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`LLM attempt ${attempt} failed`, { 
          operationId, 
          attempt, 
          error: error.message 
        });
        
        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff with jitter
          const delayMs = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 1000;
          await this.delay(delayMs);
        }
      }
    }
    
    throw new Error(`LLM failed after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Step C: Validate LLM response structure and content
   */
  validateLLMResponse(llmResponse, baseRecommendation) {
    if (!llmResponse || typeof llmResponse !== 'string') {
      throw new Error('Invalid LLM response type');
    }

    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = [
        'prioritySkills', 'learningResources', 'practiceProjects', 
        'timeline', 'whyThisPath', 'assumptions'
      ];
      
      for (const field of requiredFields) {
        if (!parsed[field] || typeof parsed[field] !== 'string' || parsed[field].trim().length < 10) {
          throw new Error(`Invalid or missing field: ${field}`);
        }
      }
      
      // Sanitize output content
      const sanitized = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (requiredFields.includes(key)) {
          sanitized[key] = this.sanitizeString(value, 2000);
        }
      }
      
      // Add metadata
      sanitized.generatedAt = new Date();
      sanitized.fallback = false;
      sanitized.validationPassed = true;
      
      return sanitized;
      
    } catch (error) {
      this.logger.warn('LLM response validation failed', { 
        error: error.message,
        responsePreview: llmResponse.substring(0, 200) 
      });
      throw new Error(`Response validation failed: ${error.message}`);
    }
  }

  /**
   * Create robust fallback response when LLM fails
   * Ensures the system always returns a usable recommendation
   */
  createFallbackResponse(baseRecommendation, inferenceTrace, reason = 'unknown') {
    this.logger.info('Creating fallback response', { reason });
    
    const skills = baseRecommendation.skills || [];
    const resources = baseRecommendation.resources || [];
    const projects = baseRecommendation.projects || [];
    
    return {
      prioritySkills: skills.length > 0 
        ? `• ${skills.slice(0, 5).join('\n• ')}`
        : '• Fundamental programming concepts\n• Problem-solving techniques\n• Code organization and best practices',
      
      learningResources: resources.length > 0
        ? `• ${resources.slice(0, 4).join('\n• ')}`
        : '• Official documentation and tutorials\n• Interactive coding platforms\n• Community forums and Q&A sites\n• Project-based learning resources',
      
      practiceProjects: projects.length > 0
        ? `• ${projects.slice(0, 3).join('\n• ')}`
        : '• Build a personal portfolio website\n• Create a simple CRUD application\n• Contribute to an open-source project',
      
      timeline: baseRecommendation.timeline || 
        'Week 1-2: Foundation concepts and setup\nWeek 3-4: Core skill development\nWeek 5-8: Hands-on project work\nWeek 9-12: Advanced topics and portfolio building',
      
      whyThisPath: `This learning path was generated by our inference engine based on your profile analysis. ${inferenceTrace?.appliedRules?.length || 0} expert rules were applied to match your goals with proven learning strategies.`,
      
      assumptions: `LLM refinement unavailable (${reason}) — showing base recommendations from our rule-based inference engine with proven learning outcomes.`,
      
      generatedAt: new Date(),
      fallback: true,
      fallbackReason: reason
    };
  }

  // === Utility Methods ===

  sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    
    return input
      .substring(0, maxLength)
      .replace(/<script\b[^>]*>(.*?)<\/script>/gi, '$1') // Extract content from script tags, remove tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .replace(/[<>{}]/g, '') // Remove remaining HTML/template injection chars
      .trim();
  }

  sanitizeNumber(input, min = 0, max = 100) {
    const num = parseInt(input);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  sanitizeEnum(input, allowedValues) {
    return allowedValues.includes(input) ? input : allowedValues[0] || '';
  }

  sanitizeArray(input, allowedValues) {
    if (!Array.isArray(input)) return [];
    return input.filter(item => allowedValues.includes(item)).slice(0, 10);
  }

  enforceContextLimits(prompt) {
    if (prompt.length <= this.MAX_CONTEXT_LENGTH) return prompt;
    
    // Truncate gracefully at sentence boundaries
    const truncated = prompt.substring(0, this.MAX_CONTEXT_LENGTH);
    const lastSentence = truncated.lastIndexOf('.');
    
    // If we found a sentence boundary, use it (unless it's extremely early - less than 10 chars)
    return lastSentence >= 10
      ? truncated.substring(0, lastSentence + 1)
      : truncated;
  }

  // Label formatting methods (same as original service)
  getEducationLabel(value) {
    const labels = {
      'high_school': 'High School',
      'bachelors': 'Bachelor\'s Degree', 
      'masters': 'Master\'s Degree',
      'phd': 'PhD',
      'bootcamp': 'Bootcamp Graduate',
      'self_taught': 'Self-Taught'
    };
    return labels[value] || 'Not specified';
  }

  getExperienceLabel(value) {
    if (!value && value !== 0) return 'Not specified';
    const years = parseInt(value);
    if (years === 0) return 'Complete Beginner';
    if (years <= 2) return 'Beginner (0-2 years)';
    if (years <= 5) return 'Intermediate (2-5 years)';
    return 'Advanced (5+ years)';
  }

  getCommitmentLabel(value) {
    if (!value && value !== 0) return 'Not specified';
    const hours = parseInt(value);
    if (hours <= 5) return 'Light (≤5 hours/week)';
    if (hours <= 15) return 'Moderate (6-15 hours/week)';
    if (hours <= 25) return 'Serious (16-25 hours/week)';
    return 'Intensive (25+ hours/week)';
  }

  getFocusLabel(value) {
    const labels = {
      'frontend': 'Frontend Development',
      'backend': 'Backend Development',
      'fullstack': 'Full-Stack Development', 
      'mobile': 'Mobile Development',
      'data': 'Data Science',
      'unsure': 'Exploring Options'
    };
    return labels[value] || 'Not specified';
  }

  getCareerGoalLabel(value) {
    const labels = {
      'job_switch': 'Career Change',
      'promotion': 'Career Advancement',
      'freelance': 'Freelancing', 
      'startup': 'Entrepreneurship',
      'learning': 'Skill Building'
    };
    return labels[value] || 'Not specified';
  }

  getLearningStyleLabel(value) {
    if (!Array.isArray(value)) return 'Not specified';
    const styles = {
      'visual': 'Visual Learning',
      'hands_on': 'Hands-on Practice',
      'reading': 'Reading & Documentation',
      'video_courses': 'Video Courses', 
      'interactive': 'Interactive Tutorials'
    };
    return value.map(v => styles[v] || v).join(', ');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Answer clarifying questions about the recommendation with hardened validation
   * @param {Object} session - User session
   * @param {string} question - User's question
   * @param {Object} baseRecommendation - Original inference result
   * @param {Object} refinedRecommendation - LLM refined result
   * @returns {Object} Clarification response
   */
  async answerClarifyingQuestion(session, question, baseRecommendation, refinedRecommendation) {
    const operationId = `clarify_${Date.now()}`;
    this.logger.info('Starting clarifying question response', { operationId, sessionId: session.id });

    try {
      // Early return if LLM unavailable
      if (!this.groq) {
        this.logger.warn('LLM unavailable for clarification', { operationId });
        return this.createClarificationFallback(question);
      }

      // Step B: Sanitize inputs
      const sanitizedProfile = this.sanitizeUserProfile(session);
      const sanitizedQuestion = this.sanitizeString(question, this.MAX_USER_INPUT_LENGTH);
      
      if (sanitizedQuestion.length < 3) {
        return {
          answer: 'Your question is too short or contains invalid characters. Please rephrase your question.',
          confidence: 'low',
          error: true,
          generatedAt: new Date()
        };
      }
      
      // Step A: Build safe clarification prompt
      const prompt = this.buildClarificationPrompt(
        sanitizedProfile,
        sanitizedQuestion,
        baseRecommendation,
        refinedRecommendation
      );
      
      // Step C: Execute with retry and validation
      const response = await this.executeWithRetry(prompt, operationId);
      
      // Validate and sanitize response
      const sanitizedAnswer = this.sanitizeString(response, 1000);
      
      if (sanitizedAnswer.length < 10) {
        throw new Error('LLM response too short for meaningful clarification');
      }
      
      this.logger.info('Clarifying question answered successfully', { operationId });
      
      return {
        answer: sanitizedAnswer,
        confidence: 'medium',
        generatedAt: new Date(),
        fallback: false
      };
      
    } catch (error) {
      this.logger.error('Clarification failed', { 
        operationId,
        error: error.message 
      });
      
      return this.createClarificationFallback(question);
    }
  }

  /**
   * Build safe prompt for answering clarifying questions
   * @param {Object} sanitizedProfile - User profile
   * @param {string} question - User's question
   * @param {Object} baseRecommendation - Base recommendation
   * @param {Object} refinedRecommendation - Refined recommendation
   * @returns {string} Complete prompt
   */
  buildClarificationPrompt(sanitizedProfile, question, baseRecommendation, refinedRecommendation) {
    const contextData = {
      profile: sanitizedProfile,
      question: question,
      prioritySkills: refinedRecommendation?.prioritySkills || 'Not available',
      learningResources: refinedRecommendation?.learningResources || 'Not available',
      practiceProjects: refinedRecommendation?.practiceProjects || 'Not available',
      timeline: refinedRecommendation?.timeline || 'Not available'
    };

    const userPrompt = `You are a career guidance counselor helping to clarify questions about a personalized learning roadmap. Answer ONLY based on the provided recommendation data - do not invent new information.

**USER PROFILE:**
- Domain: ${contextData.profile.domain || 'Not specified'}
- Education: ${this.getEducationLabel(contextData.profile.educationLevel)}
- Experience: ${this.getExperienceLabel(contextData.profile.experienceYears)}
- Focus Area: ${this.getFocusLabel(contextData.profile.focusArea)}
- Career Goal: ${this.getCareerGoalLabel(contextData.profile.careerGoal)}
- Learning Style: ${this.getLearningStyleLabel(contextData.profile.learningStyle)}

**RECOMMENDED ROADMAP:**
Priority Skills: ${contextData.prioritySkills}
Learning Resources: ${contextData.learningResources}  
Practice Projects: ${contextData.practiceProjects}
Timeline: ${contextData.timeline}

**USER QUESTION:** "${contextData.question}"

**INSTRUCTIONS:**
- Provide a helpful, specific answer based ONLY on the roadmap above
- If the question asks about something not in the roadmap, acknowledge the limitation
- Keep the response concise (2-3 sentences maximum)
- Reference specific elements from the roadmap when possible  
- Do not suggest new skills, resources, or timeline changes not already mentioned
- Be professional and supportive

**ANSWER:**`;

    return {
      messages: [
        this.SYSTEM_INSTRUCTIONS,
        {
          role: 'user',
          content: this.enforceContextLimits(userPrompt)
        }
      ]
    };
  }

  /**
   * Create fallback response for clarifying questions
   */
  createClarificationFallback(question) {
    return {
      answer: 'I apologize, but I\'m unable to provide a detailed clarification at this time due to system limitations. Please refer to your original recommendation or contact support for assistance.',
      confidence: 'low',
      error: true,
      fallback: true,
      generatedAt: new Date()
    };
  }

  /**
   * Health check method for monitoring
   */
  async healthCheck() {
    return {
      llmAvailable: !!this.groq,
      apiKeyConfigured: !!process.env.GROQ_API_KEY,
      maxRetries: this.MAX_RETRIES,
      timeoutMs: this.TIMEOUT_MS,
      contextLimits: {
        maxContext: this.MAX_CONTEXT_LENGTH,
        maxUserInput: this.MAX_USER_INPUT_LENGTH
      }
    };
  }
}

module.exports = HardenedLLMService;