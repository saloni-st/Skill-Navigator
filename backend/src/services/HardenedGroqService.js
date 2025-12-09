  const GroqService = require('./GroqService');
const featureFlags = require('../utils/featureFlags');
const { logInferencePipeline } = require('../utils/debugLogger');

/**
 * Hardened LLM Service with robust error handling, validation, and fallback
 * Built on top of the existing GroqService for better performance and cost efficiency
 */
class HardenedGroqService {
  constructor() {
    this.baseGroqService = new GroqService();
    this.config = featureFlags.getLLMConfig();
    
    // Response cache for identical requests
    this.responseCache = new Map();
    
    // Validation patterns
    this.validationPatterns = {
      urls: /https?:\/\/[^\s]+/gi,
      suspiciousContent: /\[.*fabricated.*\]|FAKE|INVENTED|PLACEHOLDER/gi,
      requiredSections: [
        'prioritized skills',
        'resources',
        'projects',
        'timeline',
        'why this path'
      ]
    };
  }
  
  /**
   * Hardened refineRecommendation with retries, validation, and fallback
   * @param {Object} baseRecommendation - Base recommendation from inference engine
   * @param {Array} ruleTrace - Array of matched rules with explanations
   * @param {Object} userProfile - Sanitized user profile facts
   * @param {String} domain - Domain name
   * @param {String} sessionId - Session ID for logging
   * @returns {Object} - Refined recommendation or fallback
   */
  async refineRecommendation(baseRecommendation, ruleTrace, userProfile, domain, sessionId) {
    const startTime = Date.now();
    
    try {
      // Step 1: Sanitize and limit context
      const sanitizedContext = this.sanitizeContext(baseRecommendation, ruleTrace, userProfile);
      
      // Step 2: Create request hash for caching/deduplication
      const requestHash = this.createRequestHash(sanitizedContext, domain);
      
      // Step 3: Check cache first
      if (this.responseCache.has(requestHash)) {
        logInferencePipeline.llmResponseReceived(sessionId, 'cached', 0, 0, true);
        return {
          ...this.responseCache.get(requestHash),
          llmStatus: 'cached'
        };
      }
      
      // Step 4: Prepare safe prompt
      const safePrompt = this.createSafePrompt(sanitizedContext, domain);
      
      logInferencePipeline.llmRequestPrepared(
        sessionId, 
        requestHash, 
        JSON.stringify(safePrompt).length,
        this.config.timeout
      );
      
      // Step 5: Make LLM call with retry logic
      let lastError = null;
      let attempt = 0;
      
      for (attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          const response = await this.makeGroqCall(safePrompt, sessionId, attempt);
          
          // Step 6: Validate response
          const validationResult = this.validateResponse(response, ruleTrace, sessionId);
          
          if (validationResult.valid) {
            // Success! Cache and return
            const latency = Date.now() - startTime;
            
            logInferencePipeline.llmResponseReceived(
              sessionId, 
              'success', 
              latency, 
              JSON.stringify(response).length, 
              true
            );
            
            const result = {
              ...response,
              llmStatus: 'success',
              requestHash,
              latency
            };
            
            this.responseCache.set(requestHash, result);
            return result;
          } else {
            lastError = new Error(`Validation failed: ${validationResult.reason}`);
            logInferencePipeline.llmResponseReceived(
              sessionId,
              'validation_failed',
              Date.now() - startTime,
              JSON.stringify(response).length,
              false
            );
          }
          
        } catch (callError) {
          lastError = callError;
          logInferencePipeline.llmResponseReceived(
            sessionId,
            'call_failed', 
            Date.now() - startTime,
            0,
            false
          );
          
          // If this is a retry, wait a bit
          if (attempt < this.config.maxRetries) {
            await this.sleep(1000 * (attempt + 1)); // Progressive backoff
          }
        }
      }
      
      // Step 7: All retries failed - return fallback
      return this.createFallbackResponse(baseRecommendation, sessionId, lastError);
      
    } catch (error) {
      logInferencePipeline.llmResponseReceived(
        sessionId,
        'error',
        Date.now() - startTime, 
        0,
        false
      );
      
      return this.createFallbackResponse(baseRecommendation, sessionId, error);
    }
  }
  
  /**
   * Make the actual Groq API call with timeout
   * @param {Object} promptData - Prepared prompt data
   * @param {String} sessionId - Session ID for logging
   * @param {Number} attempt - Attempt number (0-based)
   * @returns {Object} - Groq response
   */
  async makeGroqCall(promptData, sessionId, attempt = 0) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM call timeout')), this.config.timeout);
    });
    
    const groqCallPromise = this.baseGroqService.refineRecommendation(
      promptData.baseRecommendation,
      promptData.ruleTrace,
      promptData.userProfile,
      promptData.domain
    );
    
    return Promise.race([groqCallPromise, timeoutPromise]);
  }
  
  /**
   * Sanitize context to prevent injection and limit size
   * @param {Object} baseRec - Base recommendation
   * @param {Array} ruleTrace - Rule trace array
   * @param {Object} userProfile - User profile
   * @returns {Object} - Sanitized context
   */
  sanitizeContext(baseRec, ruleTrace, userProfile) {
    // Convert user profile to labeled facts only (no free text)
    const sanitizedProfile = {
      experienceLevel: userProfile.experienceLevel || 'unknown',
      educationLevel: userProfile.educationLevel || 'unknown', 
      weeklyHours: userProfile.weeklyHours || 0,
      primaryGoal: userProfile.primaryGoal || 'unknown',
      timeframe: userProfile.timeframe || 'unknown',
      learningStyle: userProfile.learningStyle || 'unknown'
    };
    
    // Limit rule trace to top 5 most relevant rules
    const limitedTrace = (ruleTrace || [])
      .slice(0, 5)
      .map(trace => ({
        ruleTitle: trace.title || trace.rule?.title || 'Unknown Rule',
        explanation: trace.explanation || trace.reason || 'Applied based on profile match',
        priority: trace.priority || trace.rule?.priority || 'medium'
      }));
    
    // Clean base recommendation
    const cleanBaseRec = {
      summary: baseRec.summary ? baseRec.summary.substring(0, 500) : 'Career guidance available',
      skills: baseRec.skills || [],
      timeline: baseRec.timeline || 'Flexible timeline based on availability',
      difficulty: baseRec.difficulty || 'beginner'
    };
    
    return {
      baseRecommendation: cleanBaseRec,
      ruleTrace: limitedTrace,
      userProfile: sanitizedProfile
    };
  }
  
  /**
   * Create safe, structured prompt for Groq
   * @param {Object} context - Sanitized context
   * @param {String} domain - Domain name
   * @returns {Object} - Prompt parameters for Groq service
   */
  createSafePrompt(context, domain) {
    return {
      baseRecommendation: context.baseRecommendation,
      ruleTrace: context.ruleTrace,
      userProfile: context.userProfile,
      domain: domain
    };
  }
  
  /**
   * Validate LLM response for required content and safety
   * @param {Object} response - LLM response object
   * @param {Array} originalTrace - Original rule trace for reference checking
   * @param {String} sessionId - Session ID for logging
   * @returns {Object} - {valid: boolean, reason: string}
   */
  validateResponse(response, originalTrace, sessionId) {
    try {
      // Check 1: Response has required structure
      if (!response.roadmap || typeof response.roadmap !== 'object') {
        return { valid: false, reason: 'Missing roadmap structure' };
      }
      
      const roadmap = response.roadmap;
      
      // Check 2: Has all required sections
      const requiredSections = ['skills', 'resources', 'projects', 'timeline', 'explanation'];
      for (const section of requiredSections) {
        if (!roadmap[section]) {
          return { valid: false, reason: `Missing required section: ${section}` };
        }
      }
      
      // Check 3: No suspicious fabricated content
      const fullText = JSON.stringify(response);
      if (this.validationPatterns.suspiciousContent.test(fullText)) {
        return { valid: false, reason: 'Contains suspicious/fabricated content' };
      }
      
      // Check 4: No URLs generated (unless specifically allowed)
      const urlMatches = fullText.match(this.validationPatterns.urls);
      if (urlMatches && urlMatches.length > 0) {
        return { valid: false, reason: 'Contains generated URLs' };
      }
      
      // Check 5: "Why this path" references rule trace
      if (roadmap.explanation) {
        const hasRuleReference = originalTrace.some(trace => {
          const ruleTitle = trace.title || trace.rule?.title || '';
          const explanation = trace.explanation || trace.reason || '';
          return roadmap.explanation.toLowerCase().includes(ruleTitle.toLowerCase()) ||
                 roadmap.explanation.toLowerCase().includes(explanation.toLowerCase());
        });
        
        if (!hasRuleReference) {
          return { valid: false, reason: 'Explanation does not reference rule trace' };
        }
      }
      
      // All checks passed
      return { valid: true, reason: 'Response validated successfully' };
      
    } catch (error) {
      return { valid: false, reason: `Validation error: ${error.message}` };
    }
  }
  
  /**
   * Create fallback response when LLM fails
   * @param {Object} baseRecommendation - Base recommendation to fall back to
   * @param {String} sessionId - Session ID for logging
   * @param {Error} error - The error that caused fallback
   * @returns {Object} - Fallback response
   */
  createFallbackResponse(baseRecommendation, sessionId, error) {
    logInferencePipeline.llmResponseReceived(sessionId, 'fallback', 0, 0, false);
    
    return {
      roadmap: {
        skills: baseRecommendation.skills || ['Core fundamentals'],
        resources: ['Official documentation', 'Community tutorials', 'Practice platforms'],
        projects: ['Beginner project', 'Intermediate application'],
        timeline: baseRecommendation.timeline || 'Flexible 12-week progression',
        explanation: baseRecommendation.summary || 'Personalized learning path based on your profile and goals.'
      },
      llmStatus: 'failed',
      fallbackReason: error?.message || 'LLM service unavailable',
      baseRecommendationUsed: true
    };
  }
  
  /**
   * Create consistent hash for request deduplication/caching
   * @param {Object} context - Sanitized context
   * @param {String} domain - Domain name
   * @returns {String} - Request hash
   */
  createRequestHash(context, domain) {
    const crypto = require('crypto');
    // Sort keys to ensure consistent JSON stringification
    const sortedContext = JSON.stringify(context, Object.keys(context).sort());
    const hashInput = JSON.stringify({ context: sortedContext, domain });
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }
  
  /**
   * Sleep utility for retry backoff
   * @param {Number} ms - Milliseconds to sleep
   * @returns {Promise} - Sleep promise
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Answer clarifying questions (for compatibility with existing code)
   * @param {String} question - The clarifying question
   * @param {Object} context - Context for the question
   * @param {String} sessionId - Session ID
   * @returns {Object} - Response with answer
   */
  async answerClarifyingQuestion(question, context = {}, sessionId = null) {
    try {
      // Use base Groq service if it has this method
      if (typeof this.baseGroqService.answerClarifyingQuestion === 'function') {
        return await this.baseGroqService.answerClarifyingQuestion(question, context, sessionId);
      }
      
      // Fallback implementation
      return {
        answer: "I'd be happy to help clarify, but I need more specific information to provide accurate guidance.",
        confidence: 0.5,
        llmStatus: 'fallback_method'
      };
      
    } catch (error) {
      return {
        answer: "I'm currently unable to process clarifying questions. Please refer to your base recommendations.",
        confidence: 0.3,
        llmStatus: 'error',
        error: error.message
      };
    }
  }
  
  /**
   * Clear response cache (useful for testing)
   */
  clearCache() {
    this.responseCache.clear();
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    return {
      size: this.responseCache.size,
      maxSize: 100 // We could make this configurable
    };
  }

  /**
   * Generate response method for direct LLM queries
   * @param {string} prompt - The prompt to send to LLM
   * @param {Object} options - Options like maxTokens, temperature
   * @returns {string} - LLM response
   */
  async generateResponse(prompt, options = {}) {
    try {
      const requestOptions = {
        maxTokens: options.maxTokens || this.config.maxTokens || 1000,
        temperature: options.temperature || this.config.temperature || 0.7,
        retries: options.retries || 3
      };

      console.log('🤖 Calling LLM with prompt:', prompt.substring(0, 200) + '...');
      
      // Add English-only instruction to prompt
      const englishOnlyPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY in English language. Do not use any other language.`;
      
      const response = await this.baseGroqService.generateText(englishOnlyPrompt, requestOptions);
      
      if (response && response.text) {
        return response.text;
      } else if (typeof response === 'string') {
        return response;
      } else {
        throw new Error('Invalid LLM response format');
      }
    } catch (error) {
      console.error('❌ LLM generateResponse failed:', error.message);
      return `Based on your profile, I recommend starting with HTML/CSS fundamentals, then progressing to JavaScript and React. Focus on building practical projects to reinforce your learning. Create a portfolio with 3-5 projects to showcase your skills to potential employers.`;
    }
  }
}

module.exports = HardenedGroqService;