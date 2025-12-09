const { Domain, Rule } = require('../models');
const ConfidenceCalculator = require('./ConfidenceCalculator');
const ResourceMappingService = require('./ResourceMappingService');
const LLMPlanningService = require('./LLMPlanningService');

class FactNormalizationService {
  /**
   * Normalizes questionnaire answers into processable facts
   * Based on docs/facts-mapping.md specifications
   */
  static normalizeAnswers(answers) {
    const facts = {};
    
    // 1. Education Level - direct mapping
    facts.educationLevel = answers.education_level || 'unknown';
    
    // 2. Experience Level and Years
    const experience = answers.coding_experience;
    if (experience === '0') {
      facts.experienceLevel = 'absolute_beginner';
      facts.experienceYears = 0;
    } else if (experience === '1') {
      facts.experienceLevel = 'beginner';
      facts.experienceYears = 0.5; // 6 months average
    } else if (experience === '2') {
      facts.experienceLevel = 'beginner';
      facts.experienceYears = 1.5; // 1.5 years average
    } else if (experience === '3') {
      facts.experienceLevel = 'intermediate';
      facts.experienceYears = 2.5;
    } else if (experience === '4') {
      facts.experienceLevel = 'intermediate';
      facts.experienceYears = 3.5;
    } else if (experience === '5+') {
      facts.experienceLevel = 'advanced';
      facts.experienceYears = 6; // Conservative estimate for 5+
    } else {
      facts.experienceLevel = 'unknown';
      facts.experienceYears = 0;
    }
    
    // 3. Study Hours and Commitment Level
    const hours = parseInt(answers.weekly_hours) || 0;
    facts.studyHours = hours;
    
    if (hours <= 5) {
      facts.commitmentLevel = 'casual';
    } else if (hours <= 15) {
      facts.commitmentLevel = 'consistent';
    } else if (hours <= 25) {
      facts.commitmentLevel = 'serious';
    } else {
      facts.commitmentLevel = 'intensive';
    }
    
    // 4. Focus Area and Career Path
    const focus = answers.web_dev_focus;
    facts.focusArea = focus;
    
    // Map focus to career path
    const focusToCareerPath = {
      'frontend': 'frontend_specialist',
      'backend': 'backend_specialist',
      'fullstack': 'fullstack_developer',
      'mobile': 'mobile_specialist',
      'unsure': 'generalist'
    };
    facts.careerPath = focusToCareerPath[focus] || 'generalist';
    
    // 5. Career Goal and Urgency
    const goal = answers.career_goal;
    facts.careerGoal = goal;
    
    // Map certain career goals to primaryGoal for rule matching
    if (goal === 'career_change') {
      facts.primaryGoal = 'career_change';
    }
    
    // Also map primary_goal if provided (for test compatibility)
    if (answers.primary_goal) {
      // Transform primary_goal values to more specific learning goals
      const goalTransformations = {
        'web_development': 'learn_web_development',
        'data_science': 'learn_data_science',
        'mobile_development': 'learn_mobile_development',
        'machine_learning': 'learn_machine_learning'
      };
      facts.primaryGoal = goalTransformations[answers.primary_goal] || answers.primary_goal;
    }
    
    // Map goal to urgency level
    const goalToUrgency = {
      'job_switch': 'high',
      'skill_upgrade': 'low',
      'freelance': 'medium',
      'side_business': 'medium',
      'personal_projects': 'low'
    };
    facts.urgency = goalToUrgency[goal] || 'medium';
    
    // 6. Learning Preferences and Resource Types
    const learningStyles = Array.isArray(answers.learning_style) 
      ? answers.learning_style 
      : (answers.learning_style ? [answers.learning_style] : []);
    facts.learningPreferences = [];
    facts.resourceTypes = [];
    
    // Map learning styles to preferences and resource types
    learningStyles.forEach(style => {
      switch (style) {
        case 'video_courses':
          facts.learningPreferences.push('visual');
          facts.resourceTypes.push('video');
          break;
        case 'hands_on':
          facts.learningPreferences.push('kinesthetic');
          facts.resourceTypes.push('interactive');
          break;
        case 'structured_course':
          facts.learningPreferences.push('structured');
          facts.resourceTypes.push('course');
          break;
        case 'documentation':
          facts.learningPreferences.push('reading');
          facts.resourceTypes.push('text');
          break;
        case 'community':
          facts.learningPreferences.push('social');
          facts.resourceTypes.push('forum');
          break;
      }
    });
    
    // Remove duplicates
    facts.learningPreferences = [...new Set(facts.learningPreferences)];
    facts.resourceTypes = [...new Set(facts.resourceTypes)];
    
    // 8. Additional fields for test compatibility
    if (answers.interests) {
      facts.interests = answers.interests;
    }
    
    // 7. Inconsistency Detection
    facts.flags = this.detectInconsistencies(facts);
    
    return facts;
  }
  
  /**
   * Detects logical inconsistencies in the normalized facts
   */
  static detectInconsistencies(facts) {
    const flags = [];
    
    // Advanced experience but very low time commitment for employment goal
    if (facts.experienceLevel === 'advanced' && 
        facts.commitmentLevel === 'casual' && 
        facts.urgency === 'high') {
      flags.push('inconsistent_profile');
    }
    
    // High urgency but low commitment
    if (facts.urgency === 'high' && facts.commitmentLevel === 'casual') {
      flags.push('unrealistic_timeline');
    }
    
    // Advanced level but absolute beginner experience
    if (facts.educationLevel === 'phd' && facts.experienceLevel === 'absolute_beginner') {
      flags.push('education_experience_mismatch');
    }
    
    return flags;
  }
}

class RuleEngine {
  constructor() {
    this.rules = [];
    this.trace = [];
    this.confidenceCalculator = new ConfidenceCalculator();
    this.llmPlanningService = new LLMPlanningService();
  }
  
  /**
   * Loads rules from database for a specific domain
   */
  async loadRules(domainId) {
    try {
      const rules = await Rule.find({ domainId }).sort({ priority: -1 });
      console.log('🔄 Loading rules for domainId:', domainId);
      console.log('📊 Raw rules from DB count:', rules.length);
      console.log('📋 First raw rule:', rules[0] ? {
        name: rules[0].name,
        hasConditions: !!rules[0].conditions,
        conditions: rules[0].conditions,
        hasRecommendations: !!rules[0].recommendations
      } : 'No rules found');
      
      this.rules = rules.map(rule => ({
        _id: rule._id,
        id: rule._id,
        name: rule.name || rule.title,
        title: rule.title,
        priority: rule.priority,
        weight: rule.weight,
        conditions: rule.conditions,
        recommendations: rule.recommendations,
        action: rule.action,
        isActive: rule.isActive !== false // Default to true if not specified
      }));
      
      console.log('📊 Mapped rules count:', this.rules.length);
      console.log('📋 First mapped rule:', this.rules[0] ? {
        name: this.rules[0].name,
        hasConditions: !!this.rules[0].conditions,
        conditions: this.rules[0].conditions
      } : 'No rules found');
      
      this.trace.push({
        step: 'rule_loading',
        message: `Loaded ${this.rules.length} rules for domain ${domainId}`,
        timestamp: new Date()
      });
      
      return this.rules.length;
    } catch (error) {
      this.trace.push({
        step: 'rule_loading',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }
  
  /**
   * Evaluates a single condition against normalized facts
   * @param {Object} condition - { field, operator, value }
   * @param {Object} facts - Normalized facts object
   * @returns {Object} - { matches, matchStrength, actualValue }
   */
  evaluateCondition(condition, facts) {
    const { field, operator, value } = condition;
    const actualValue = facts[field];
    
    let matches = false;
    let matchStrength = 0.0;
    
    try {
      switch (operator) {
        case 'eq':
          matches = actualValue === value;
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'neq':
          matches = actualValue !== value;
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'gte':
          matches = (typeof actualValue === 'number') && (actualValue >= value);
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'lte':
          matches = (typeof actualValue === 'number') && (actualValue <= value);
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'gt':
          matches = (typeof actualValue === 'number') && (actualValue > value);
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'lt':
          matches = (typeof actualValue === 'number') && (actualValue < value);
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'contains':
          if (Array.isArray(actualValue)) {
            matches = actualValue.includes(value);
          } else if (typeof actualValue === 'string') {
            matches = actualValue.includes(value);
          }
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'in':
          if (Array.isArray(value)) {
            matches = value.includes(actualValue);
          }
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        case 'regex':
          if (typeof actualValue === 'string') {
            // Handle inline flags like (?i) for case insensitive
            let pattern = value;
            let flags = 'i'; // Default case insensitive
            
            // Check for inline case-insensitive flag
            if (pattern.startsWith('(?i)')) {
              pattern = pattern.substring(4);
              flags = 'i';
            } else if (pattern.startsWith('(?-i)')) {
              pattern = pattern.substring(5);
              flags = '';
            }
            
            const regex = new RegExp(pattern, flags);
            matches = regex.test(actualValue);
          }
          matchStrength = matches ? 1.0 : 0.0;
          break;
          
        default:
          matches = false;
          matchStrength = 0.0;
          break;
      }
    } catch (error) {
      matches = false;
      matchStrength = 0.0;
    }
    
    return {
      matches,
      matchStrength,
      actualValue,
      operator,
      expectedValue: value
    };
  }

  /**
   * Evaluates a single rule against normalized facts
   */
  evaluateRule(rule, facts) {
    if (!rule.isActive) {
      return { matches: false, reason: 'Rule is inactive' };
    }

    const conditions = rule.conditions;
    
    // Handle null or undefined conditions
    if (!conditions || typeof conditions !== 'object') {
      console.log('⚠️ Rule has no valid conditions:', rule.name);
      return {
        matches: false,
        matchDetails: [],
        reason: `Rule "${rule.name}" has invalid or missing conditions`
      };
    }
    
    let allConditionsMet = true;
    const matchDetails = [];

    // Check each condition
    for (const [factKey, expectedValue] of Object.entries(conditions)) {
      const actualValue = facts[factKey];

      if (Array.isArray(expectedValue)) {
        // OR conditions - any value in array matches
        const matches = expectedValue.some(expected => 
          this.compareValues(actualValue, expected));
        
        if (matches) {
          matchDetails.push(`${factKey}: ${actualValue} matches ${expectedValue.join(' OR ')}`);
        } else {
          matchDetails.push(`${factKey}: ${actualValue} does not match ${expectedValue.join(' OR ')}`);
          allConditionsMet = false;
        }
      } else if (typeof expectedValue === 'string' && expectedValue.includes('>=')) {
        // Handle operators using evaluateCondition method
        const condition = { field: factKey, operator: 'gte', value: parseFloat(expectedValue.substring(2)) };
        const evaluation = this.evaluateCondition(condition, facts);
        
        if (evaluation.matches) {
          matchDetails.push(`${factKey}: ${actualValue} ${expectedValue} (${evaluation.matches})`);
        } else {
          matchDetails.push(`${factKey}: ${actualValue} does not satisfy ${expectedValue}`);
          allConditionsMet = false;
        }
      } else if (typeof expectedValue === 'string' && expectedValue.includes('<=')) {
        // Handle operators using evaluateCondition method  
        const condition = { field: factKey, operator: 'lte', value: parseFloat(expectedValue.substring(2)) };
        const evaluation = this.evaluateCondition(condition, facts);
        
        if (evaluation.matches) {
          matchDetails.push(`${factKey}: ${actualValue} ${expectedValue} (${evaluation.matches})`);
        } else {
          matchDetails.push(`${factKey}: ${actualValue} does not satisfy ${expectedValue}`);
          allConditionsMet = false;
        }
      } else {
        // Single condition - direct comparison
        const matches = this.compareValues(actualValue, expectedValue);
        
        if (matches) {
          matchDetails.push(`${factKey}: ${actualValue} matches ${expectedValue}`);
        } else {
          matchDetails.push(`${factKey}: ${actualValue} does not match ${expectedValue}`);
          allConditionsMet = false;
        }
      }
    }

    return {
      matches: allConditionsMet,
      matchDetails,
      reason: allConditionsMet ? 'All conditions met' : 'Some conditions failed'
    };
  }  /**
   * Compares two values with flexible matching
   */
  compareValues(actual, expected) {
    // Handle array containment (for learningPreferences, resourceTypes)
    if (Array.isArray(actual) && typeof expected === 'string') {
      return actual.includes(expected);
    }
    
    // Handle numeric ranges
    if (typeof actual === 'number' && typeof expected === 'string') {
      if (expected.startsWith('>=')) {
        return actual >= parseFloat(expected.substring(2));
      }
      if (expected.startsWith('<=')) {
        return actual <= parseFloat(expected.substring(2));
      }
      if (expected.startsWith('>')) {
        return actual > parseFloat(expected.substring(1));
      }
      if (expected.startsWith('<')) {
        return actual < parseFloat(expected.substring(1));
      }
    }
    
    // Direct equality
    return actual === expected;
  }
  
  /**
   * Processes all rules and returns matched rules with priority ordering
   */
  processRules(facts) {
    const matchedRules = [];
    
    this.trace.push({
      step: 'rule_processing_start',
      message: `Starting rule evaluation with ${this.rules.length} rules`,
      facts,
      timestamp: new Date()
    });
    
    // Evaluate each rule
    for (const rule of this.rules) {
      const evaluation = this.evaluateRule(rule, facts);
      
      this.trace.push({
        step: 'rule_evaluation',
        rule: rule,
        ruleName: rule.name,
        priority: rule.priority,
        matched: evaluation.matches,
        matches: evaluation.matches,
        matchStrength: evaluation.matches ? 1.0 : 0.0,
        ruleScore: evaluation.matches ? (rule.weight || 0.5) : 0,
        details: evaluation.matchDetails,
        timestamp: new Date()
      });
      
      if (evaluation.matches) {
        matchedRules.push({
          rule,
          evaluation
        });
      }
    }
    
    // Sort by priority (highest first)
    matchedRules.sort((a, b) => b.rule.priority - a.rule.priority);
    
    this.trace.push({
      step: 'rule_processing_complete',
      message: `Found ${matchedRules.length} matching rules`,
      matchedRuleNames: matchedRules.map(mr => mr.rule.name),
      timestamp: new Date()
    });
    
    return matchedRules;
  }
  
  /**
   * Combines recommendations from multiple matched rules
   */
  combineRecommendations(matchedRules, facts) {
    // Validate inputs
    if (!facts || typeof facts !== 'object') {
      throw new Error('facts parameter is required and must be an object');
    }
    
    const combinedRec = {
      skills: [],
      resources: [],
      projects: [],
      timeline: null,
      warnings: [],
      metadata: {
        appliedRules: [],
        confidence: 0,
        reasoning: []
      }
    };
    
    // Handle flag-based warnings
    if (facts.flags && facts.flags.length > 0) {
      facts.flags.forEach(flag => {
        switch (flag) {
          case 'inconsistent_profile':
            combinedRec.warnings.push('Your profile shows some inconsistencies. Please review your time commitment for your career goals.');
            break;
          case 'unrealistic_timeline':
            combinedRec.warnings.push('Your timeline expectations may be challenging given your available study time.');
            break;
          case 'education_experience_mismatch':
            combinedRec.warnings.push('Consider how your educational background can accelerate your learning.');
            break;
        }
      });
    }
    
    if (matchedRules.length === 0) {
      // Fallback recommendation
      combinedRec.skills = ['HTML/CSS', 'JavaScript Basics'];
      combinedRec.resources = ['MDN Web Docs', 'freeCodeCamp'];
      combinedRec.projects = ['Personal Portfolio Website'];
      combinedRec.timeline = '16-20 weeks';
      combinedRec.summary = 'Using fallback recommendation - no specific rules matched your profile';
      combinedRec.metadata.reasoning.push('Using fallback recommendation - no specific rules matched');
      combinedRec.metadata.confidence = 0.3;
      
      this.trace.push({
        step: 'fallback_recommendation',
        message: 'No rules matched, using fallback recommendation',
        timestamp: new Date()
      });
      
      return combinedRec;
    }
    
    // Apply rules in priority order
    matchedRules.forEach((matchedRule, index) => {
      const rule = matchedRule.rule;
      // Use 'recommendations' for new schema or 'action' for legacy schema
      const rec = rule.recommendations || rule.action;
      
      if (!rec) {
        console.log('⚠️ Rule has no recommendations or action:', rule.name);
        return; // Skip this rule
      }
      
      // Skills - merge arrays and remove duplicates
      if (rec.skills) {
        combinedRec.skills = [...new Set([...combinedRec.skills, ...rec.skills])];
      }
      
      // Resources - merge arrays and remove duplicates  
      if (rec.resources) {
        combinedRec.resources = [...new Set([...combinedRec.resources, ...rec.resources])];
      }
      
      // Projects - merge arrays and remove duplicates
      if (rec.projects) {
        combinedRec.projects = [...new Set([...combinedRec.projects, ...rec.projects])];
      }
      
      // Timeline - use from highest priority rule
      if (rec.timeline && !combinedRec.timeline) {
        combinedRec.timeline = rec.timeline;
      }
      
      // Warnings - merge arrays
      if (rec.warnings) {
        combinedRec.warnings = [...combinedRec.warnings, ...rec.warnings];
      }
      
      // Track applied rules
      combinedRec.metadata.appliedRules.push({
        name: rule.name,
        priority: rule.priority,
        contribution: index === 0 ? 'primary' : 'supplementary'
      });
      
      combinedRec.metadata.reasoning.push(
        `Applied "${rule.name}" (Priority ${rule.priority}): ${matchedRule.evaluation.reason}`
      );
    });
    
    // Calculate confidence based on rule matches and consistency  
    const confidenceResult = this.confidenceCalculator.calculateConfidence(
      matchedRules, 
      facts, 
      this.currentDomainId || 'unknown',
      this.currentSessionId || 'unknown'
    );
    
    combinedRec.metadata.confidence = confidenceResult.confidence;
    combinedRec.metadata.confidenceBreakdown = confidenceResult.breakdown;
    
    this.trace.push({
      step: 'recommendation_combination',
      message: `Combined recommendations from ${matchedRules.length} rules`,
      appliedRules: combinedRec.metadata.appliedRules,
      confidence: combinedRec.metadata.confidence,
      confidenceBreakdown: combinedRec.metadata.confidenceBreakdown,
      timestamp: new Date()
    });
    
    return combinedRec;
  }
  
  /**
   * Set session context for logging
   */
  setSessionContext(domainId, sessionId) {
    this.currentDomainId = domainId;
    this.currentSessionId = sessionId;
  }
  
  /**
   * Main inference method
   */
  async infer(domainId, answers, sessionId = null) {
    this.trace = []; // Reset trace
    
    // Set session context for confidence calculation
    this.setSessionContext(domainId, sessionId);
    
    try {
      console.log('🔍 InferenceEngine.infer called');
      console.log('- domainId:', domainId);
      console.log('- sessionId:', sessionId);
      console.log('- answers:', answers);
      console.log('- answers type:', typeof answers);
      console.log('- answers keys:', answers ? Object.keys(answers) : 'null/undefined');
      
      // Validate inputs
      if (!answers || typeof answers !== 'object') {
        throw new Error('answers parameter is required and must be an object');
      }
      
      this.trace.push({
        step: 'inference_start',
        domainId,
        answersReceived: Object.keys(answers).length,
        timestamp: new Date()
      });
      
      console.log('✅ Step 1: Starting fact normalization');
      // Step 1: Normalize answers to facts
      console.log('About to call FactNormalizationService.normalizeAnswers with:', answers);
      const facts = FactNormalizationService.normalizeAnswers(answers);
      console.log('✅ Facts normalized:', facts);
      console.log('Facts type:', typeof facts);
      console.log('Facts is null/undefined:', facts == null);
      
      this.trace.push({
        step: 'fact_normalization',
        normalizedFacts: facts,
        timestamp: new Date()
      });
      
      console.log('✅ Step 2: Loading rules for domain');
      // Step 2: Load rules for domain
      await this.loadRules(domainId);
      console.log('✅ Rules loaded, count:', this.rules.length);
      
      console.log('✅ Step 3: Processing rules');
      // Step 3: Process rules against facts
      const matchedRules = this.processRules(facts);
      console.log('✅ Rules processed, matched:', matchedRules.length);
      
      console.log('✅ Step 4: Combining recommendations');
      // Step 4: Combine recommendations
      const recommendation = this.combineRecommendations(matchedRules, facts);
      console.log('✅ Recommendations combined');
      
      // Step 5: Enhance with real resources
      console.log('✅ Step 5: Enhancing with real resources');
      recommendation.detailedResources = ResourceMappingService.transformResources(recommendation.resources);
      recommendation.learningRecommendations = ResourceMappingService.generateRecommendations(
        recommendation.skills, 
        recommendation.resources, 
        facts.learningPreferences || []
      );
      console.log('✅ Resources enhanced');

      // Step 6: Generate detailed LLM learning plan WITH REAL WEB SEARCH
      console.log('✅ Step 6: Generating LLM learning plan with REAL internet search');
      try {
        const userProfile = this.extractUserProfile(facts, answers);
        console.log('👤 User profile extracted:', userProfile);
        
        // NEW: Use the enhanced LLM planning with real web search
        const enhancedPlan = await this.llmPlanningService.generateDetailedLearningPlan(
          userProfile, 
          recommendation
        );
        
        console.log('🌐 Enhanced plan received:', {
          hasWeeklyPlan: !!enhancedPlan.weeklyPlan,
          hasRealTimeResources: !!enhancedPlan.realTimeResources,
          searchPerformed: enhancedPlan.searchPerformed,
          resourceTopics: enhancedPlan.realTimeResources ? Object.keys(enhancedPlan.realTimeResources) : []
        });
        
        // Add the NEW weekly plan structure to the recommendation
        if (enhancedPlan.weeklyPlan) {
          recommendation.weeklyPlan = enhancedPlan.weeklyPlan;
          recommendation.hasWeeklyPlan = true;
        }
        
        // Add the real-time web resources
        if (enhancedPlan.realTimeResources) {
          recommendation.realTimeResources = enhancedPlan.realTimeResources;
          recommendation.hasRealResources = true;
        }
        
        // Keep legacy structure for backward compatibility
        if (enhancedPlan.detailedPlan) {
          recommendation.detailedPlan = enhancedPlan.detailedPlan;
        }
        if (enhancedPlan.enhancedResources) {
          recommendation.searchEnhancedResources = enhancedPlan.enhancedResources;
        }
        
        console.log('✅ LLM learning plan with REAL web search generated successfully');
        this.trace.push({
          step: 'llm_planning_with_real_search',
          message: 'Generated detailed weekly learning plan with real internet search',
          planGenerated: !!enhancedPlan.weeklyPlan,
          realSearchPerformed: enhancedPlan.searchPerformed,
          resourceTopics: enhancedPlan.realTimeResources ? Object.keys(enhancedPlan.realTimeResources) : [],
          lastUpdated: enhancedPlan.lastUpdated,
          timestamp: new Date()
        });
      } catch (error) {
        console.warn('⚠️ LLM planning with real search failed, using basic plan:', error.message);
        console.error('LLM Error stack:', error.stack);
        this.trace.push({
          step: 'llm_planning_fallback',
          error: error.message,
          errorType: 'real_search_failed',
          timestamp: new Date()
        });
      }
      
      this.trace.push({
        step: 'inference_complete',
        recommendationGenerated: true,
        detailedResourcesGenerated: recommendation.detailedResources.length,
        learningRecommendationsGenerated: recommendation.learningRecommendations.length,
        timestamp: new Date()
      });
      
      return {
        recommendation,
        facts,
        trace: this.trace,
        metadata: {
          rulesEvaluated: this.rules.length,
          rulesMatched: matchedRules.length,
          confidence: recommendation.metadata.confidence
        }
      };
      
    } catch (error) {
      console.error('🔥 ERROR in InferenceEngine.infer');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('domainId passed:', domainId);
      console.error('answers passed:', answers);
      console.error('sessionId passed:', sessionId);
      
      this.trace.push({
        step: 'inference_error',
        error: error.message,
        timestamp: new Date()
      });
      
      throw new Error(`Inference failed: ${error.message}`);
    }
  }
  
  /**
   * Extract user profile for LLM planning
   */
  extractUserProfile(facts, originalAnswers) {
    return {
      educationLevel: facts.educationLevel || 'bachelor',
      experience: facts.experienceLevel || 'beginner',
      experienceYears: facts.experienceYears || 1,
      timeCommitment: facts.studyHours || 10,
      commitmentLevel: facts.commitmentLevel || 'consistent',
      focusArea: facts.focusArea || 'fullstack',
      careerGoal: facts.careerGoal || 'skill_upgrade',
      learningPreferences: facts.learningPreferences || ['hands_on'],
      resourceTypes: facts.resourceTypes || ['interactive'],
      urgency: facts.urgency || 'medium',
      primaryGoal: facts.primaryGoal || 'web_development',
      currentSkills: originalAnswers.current_skills || '',
      learningStyle: originalAnswers.learning_style || 'hands_on',
      timeline: originalAnswers.timeline || '6_months'
    };
  }

  /**
   * NEW: Generate learning path directly from user answers using Groq LLM
   */
  async generateLearningPathFromAnswers(domainId, answers, sessionData) {
    console.log('🎯 Generating learning path directly from user answers using Groq LLM...');
    
    try {
      // Step 1: Normalize answers
      const facts = FactNormalizationService.normalizeAnswers(answers);
      const userProfile = this.extractUserProfile(facts, answers);
      
      console.log('👤 User Profile for LLM:', userProfile);
      
      // Step 2: Use LLM Planning Service to generate personalized path
      const learningPath = await this.llmPlanningService.generateLearningPathFromAnswers(
        answers, 
        sessionData
      );
      
      console.log('🎯 Learning path generated:', {
        success: learningPath.success,
        hasWeeklyPlan: !!learningPath.learningPath?.weeklyPlan,
        hasRealResources: !!learningPath.learningPath?.realTimeResources
      });
      
      if (learningPath.success) {
        // DEBUG: Log what we received from LLM
        console.log("🔍 Learning path structure:", {
          hasLearningPath: !!learningPath.learningPath,
          learningPathKeys: Object.keys(learningPath.learningPath || {}),
          weeklyPlanExists: !!learningPath.learningPath?.weeklyPlan,
          assessmentExists: !!learningPath.learningPath?.assessment
        });
        
        // Structure the response to match expected format
        const recommendation = {
          // Extract skills from the learning path (FIXED: removed double .learningPath)
          skills: this.extractSkillsFromLearningPath(learningPath.learningPath),
          resources: this.extractResourcesFromLearningPath(learningPath.learningPath),
          projects: this.extractProjectsFromLearningPath(learningPath.learningPath),
          
          // NEW: Add the complete Groq-generated weekly plan and assessment
          weeklyPlan: learningPath.learningPath.weeklyPlan,
          assessment: learningPath.learningPath.assessment,
          careerPath: learningPath.learningPath.careerPath,
          milestones: learningPath.learningPath.milestones,
          realTimeResources: learningPath.learningPath.realTimeResources,
          
          // Enhanced learning recommendations from the weekly plan
          learningRecommendations: this.extractLearningRecommendationsFromPlan(learningPath.learningPath),
          
          userAnswerBased: true,
          generatedAt: learningPath.generatedAt,
          source: learningPath.source,
          metadata: {
            confidence: 0.9, // High confidence for LLM-generated plans
            reasoning: ['Generated using advanced AI analysis of user answers'],
            appliedRules: []
          }
        };
        
        return {
          recommendation,
          facts,
          trace: [
            {
              step: 'llm_direct_generation',
              message: 'Generated learning path directly from user answers using Groq LLM',
              userProfile,
              timestamp: new Date()
            }
          ],
          metadata: {
            rulesEvaluated: 0,
            rulesMatched: 0,
            confidence: 0.9,
            source: 'groq_llm_direct'
          }
        };
      } else {
        throw new Error('LLM learning path generation failed');
      }
    } catch (error) {
      console.error('❌ Failed to generate learning path from answers:', error);
      
      // Fallback to regular inference
      console.log('🔄 Falling back to regular inference engine...');
      return await this.infer(domainId, answers, sessionData?.id);
    }
  }
  
  extractSkillsFromLearningPath(learningPath) {
    const skills = [];
    
    console.log("🔍 [SKILLS] Extracting skills from learning path...");
    console.log("🔍 [SKILLS] Learning path type:", typeof learningPath);
    console.log("🔍 [SKILLS] Learning path is null:", learningPath === null);
    console.log("🔍 [SKILLS] Learning path keys:", Object.keys(learningPath || {}));
    
    if (!learningPath) {
      console.log("❌ [SKILLS] Learning path is null/undefined");
      return ['HTML/CSS', 'JavaScript', 'React', 'Node.js'];
    }
    
    // Extract from weekly plan topics
    if (learningPath.weeklyPlan) {
      console.log("✅ [SKILLS] Found weeklyPlan, keys:", Object.keys(learningPath.weeklyPlan));
      Object.values(learningPath.weeklyPlan).forEach((week, index) => {
        console.log(`🔍 [SKILLS] Processing week ${index + 1}:`, typeof week, week && Object.keys(week));
        if (week && typeof week === 'object') {
          if (week.topics && Array.isArray(week.topics)) {
            console.log(`✅ [SKILLS] Found topics in week ${index + 1}:`, week.topics);
            skills.push(...week.topics);
          }
          // Also check skills array in each week
          if (week.skills && Array.isArray(week.skills)) {
            console.log(`✅ [SKILLS] Found skills in week ${index + 1}:`, week.skills);
            skills.push(...week.skills);
          }
        }
      });
    } else {
      console.log("❌ [SKILLS] No weeklyPlan found");
    }
    
    // Extract from career path required skills
    if (learningPath.careerPath && learningPath.careerPath.requiredSkills) {
      console.log("✅ [SKILLS] Found careerPath requiredSkills:", learningPath.careerPath.requiredSkills);
      if (Array.isArray(learningPath.careerPath.requiredSkills)) {
        skills.push(...learningPath.careerPath.requiredSkills);
      } else if (typeof learningPath.careerPath.requiredSkills === 'string') {
        skills.push(...learningPath.careerPath.requiredSkills.split(',').map(s => s.trim()));
      }
    } else {
      console.log("❌ [SKILLS] No careerPath.requiredSkills found");
    }
    
    // Extract from milestones
    if (learningPath.milestones && Array.isArray(learningPath.milestones)) {
      learningPath.milestones.forEach(milestone => {
        if (milestone.skills && Array.isArray(milestone.skills)) {
          skills.push(...milestone.skills);
        }
      });
    }
    
    // Extract from any top-level skills array
    if (learningPath.skills && Array.isArray(learningPath.skills)) {
      skills.push(...learningPath.skills);
    }
    
    // Return unique skills from LLM only, no fallback demo data
    const uniqueSkills = [...new Set(skills.filter(skill => skill && typeof skill === 'string'))];
    console.log("📊 [SKILLS] Final extracted skills:", uniqueSkills);
    
    // Only return actual LLM-generated skills, no demo fallback
    return uniqueSkills;
  }
  
  extractResourcesFromLearningPath(learningPath) {
    const resources = [];
    
    console.log("🔍 [RESOURCES] Extracting resources from learning path...");
    
    if (!learningPath) {
      console.log("❌ [RESOURCES] Learning path is null/undefined");
      return [];
    }
    
    // Extract from weekly plan resources
    if (learningPath.weeklyPlan) {
      Object.values(learningPath.weeklyPlan).forEach((week, index) => {
        if (week && week.resources && Array.isArray(week.resources)) {
          console.log(`✅ [RESOURCES] Found resources in week ${index + 1}:`, week.resources.length);
          week.resources.forEach(resource => {
            if (resource.title) {
              resources.push(resource.title);
            } else if (typeof resource === 'string') {
              resources.push(resource);
            }
          });
        }
      });
    }
    
    // Extract from real-time resources
    if (learningPath.realTimeResources) {
      console.log("✅ [RESOURCES] Found realTimeResources");
      Object.values(learningPath.realTimeResources).forEach(topicResources => {
        if (Array.isArray(topicResources)) {
          topicResources.forEach(resource => {
            if (resource.title) {
              resources.push(resource.title);
            } else if (typeof resource === 'string') {
              resources.push(resource);
            }
          });
        }
      });
    }
    
    // Return unique resources from LLM only, no demo fallback
    const uniqueResources = [...new Set(resources.filter(resource => resource && typeof resource === 'string'))];
    console.log("📊 [RESOURCES] Final extracted resources:", uniqueResources);
    return uniqueResources;
  }
  
  extractProjectsFromLearningPath(learningPath) {
    const projects = [];
    
    console.log("🔍 [PROJECTS] Extracting projects from learning path...");
    
    if (!learningPath) {
      console.log("❌ [PROJECTS] Learning path is null/undefined");
      return [];
    }
    
    // Extract from weekly plan projects
    if (learningPath.weeklyPlan) {
      Object.values(learningPath.weeklyPlan).forEach((week, index) => {
        if (week && week.project && typeof week.project === 'string') {
          console.log(`✅ [PROJECTS] Found project in week ${index + 1}:`, week.project);
          projects.push(week.project);
        }
      });
    }
    
    // Extract from milestones projects
    if (learningPath.milestones && Array.isArray(learningPath.milestones)) {
      learningPath.milestones.forEach((milestone, index) => {
        if (milestone.project && typeof milestone.project === 'string') {
          console.log(`✅ [PROJECTS] Found project in milestone ${index + 1}:`, milestone.project);
          projects.push(milestone.project);
        }
      });
    }
    
    // Return unique projects from LLM only, no demo fallback
    const uniqueProjects = [...new Set(projects.filter(project => project && typeof project === 'string'))];
    console.log("📊 [PROJECTS] Final extracted projects:", uniqueProjects);
    return uniqueProjects;
  }

  extractLearningRecommendationsFromPlan(learningPath) {
    const recommendations = [];
    
    console.log("🔍 [LEARNING_RECS] Extracting learning recommendations from learning path...");
    
    if (!learningPath) {
      console.log("❌ [LEARNING_RECS] Learning path is null/undefined");
      return [];
    }
    
    // Extract from weekly plan resources with enhanced details
    if (learningPath.weeklyPlan) {
      Object.entries(learningPath.weeklyPlan).forEach(([weekKey, week]) => {
        if (week && week.resources && Array.isArray(week.resources)) {
          week.resources.forEach(resource => {
            if (resource.title) {
              recommendations.push({
                title: resource.title,
                description: resource.description || `Learning resource for ${week.focus || 'skill development'}`,
                priority: resource.difficulty === 'beginner' ? 'High' : 'Medium',
                estimatedTime: resource.duration || '2-3 hours',
                url: resource.url || '#',
                type: resource.type || 'tutorial'
              });
            }
          });
        }
      });
    }
    
    console.log("📊 [LEARNING_RECS] Final extracted recommendations:", recommendations.length);
    // Return only LLM-generated recommendations, no demo fallback
    return recommendations;
  }
  extractUserProfile(facts, originalAnswers) {
    return {
      education: this.mapEducationLevel(facts.educationLevel),
      experience: this.mapExperienceLevel(facts.experienceLevel, facts.experienceYears),
      timeCommitment: this.mapTimeCommitment(facts.commitmentLevel, facts.timeConstraints),
      careerGoals: this.extractCareerGoals(originalAnswers),
      learningStyle: this.mapLearningStyle(facts.learningPreferences, facts.resourceTypes),
      currentSkills: originalAnswers.current_skills || [],
      interests: originalAnswers.interests || [],
      urgency: facts.urgency || 'medium'
    };
  }
  
  mapEducationLevel(level) {
    const mapping = {
      'high_school': 'High School',
      'bachelors': 'Bachelor\'s Degree',
      'masters': 'Master\'s Degree',
      'phd': 'PhD',
      'bootcamp': 'Coding Bootcamp',
      'self_taught': 'Self-Taught'
    };
    return mapping[level] || level;
  }
  
  mapExperienceLevel(level, years) {
    if (years === 0) return 'Complete Beginner';
    if (years < 1) return 'Less than 1 year';
    if (years < 2) return '1-2 years';
    if (years < 5) return '2-5 years';
    return '5+ years';
  }
  
  mapTimeCommitment(commitmentLevel, timeConstraints) {
    const mapping = {
      'casual': '5-10 hours per week',
      'moderate': '10-20 hours per week',
      'intensive': '20+ hours per week'
    };
    return mapping[commitmentLevel] || timeConstraints || '10-15 hours per week';
  }
  
  extractCareerGoals(answers) {
    const goals = [];
    if (answers.career_goals) {
      if (Array.isArray(answers.career_goals)) {
        goals.push(...answers.career_goals);
      } else {
        goals.push(answers.career_goals);
      }
    }
    if (answers.desired_role) goals.push(`Become a ${answers.desired_role}`);
    return goals.length > 0 ? goals.join(', ') : 'General skill development';
  }
  
  mapLearningStyle(preferences, resourceTypes) {
    const styles = [];
    if (preferences.includes('visual')) styles.push('Visual learning');
    if (preferences.includes('kinesthetic')) styles.push('Hands-on practice');
    if (preferences.includes('structured')) styles.push('Structured courses');
    if (resourceTypes.includes('video')) styles.push('Video tutorials');
    if (resourceTypes.includes('interactive')) styles.push('Interactive exercises');
    return styles.length > 0 ? styles.join(', ') : 'Mixed learning approach';
  }
  
  /**
   * Get execution trace for debugging/explanation
   */
  getTrace() {
    return this.trace;
  }
  
  /**
   * Clear trace and rules (for testing)
   */
  reset() {
    this.trace = [];
    this.rules = [];
  }
}

module.exports = {
  RuleEngine,
  FactNormalizationService
};