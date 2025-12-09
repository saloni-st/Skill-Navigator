const featureFlags = require('../utils/featureFlags');
const { logInferencePipeline } = require('../utils/debugLogger');

/**
 * Robust, deterministic confidence score calculator
 * Implements the algorithm specified in Phase 1 of the implementation plan
 */
class ConfidenceCalculator {
  constructor() {
    this.config = featureFlags.getConfidenceConfig();
    
    // Priority to factor mapping
    this.priorityFactors = {
      'high': this.config.maxPriorityFactor, // 1.2
      'medium': 1.0,
      'low': 0.8,
      // Numeric fallbacks
      10: this.config.maxPriorityFactor,
      9: this.config.maxPriorityFactor,
      8: 1.1,
      7: 1.0,
      6: 1.0,
      5: 0.9,
      4: 0.8,
      3: 0.8,
      2: 0.8,
      1: 0.8
    };
    
    // Decisive facts per domain - facts that significantly impact confidence
    this.decisiveFactsByDomain = {
      'web-development': [
        'experienceLevel', 'timeAvailability', 'learningPreference', 
        'goal', 'timeframe', 'educationLevel'
      ],
      'data-science': [
        'experienceLevel', 'mathBackground', 'programmingExperience',
        'timeAvailability', 'goal', 'industryExperience'  
      ],
      'cybersecurity': [
        'experienceLevel', 'itBackground', 'certificationGoals',
        'timeAvailability', 'securityExperience', 'techBackground'
      ]
    };
  }
  
  /**
   * Main confidence calculation method
   * @param {Array} matchedRules - Array of matched rule objects with match data
   * @param {Object} facts - Normalized facts object
   * @param {String} domainId - Domain identifier for context
   * @param {String} sessionId - Session ID for logging
   * @returns {Object} - { confidence, breakdown }
   */
  calculateConfidence(matchedRules, facts, domainId, sessionId) {
    // Step 1: Calculate rule contributions
    const ruleScores = this.calculateRuleScores(matchedRules);
    
    // Step 2: Aggregate positive scores  
    const totalPositive = ruleScores.reduce((sum, score) => sum + score.contribution, 0);
    
    // Step 3: Calculate theoretical maximum
    const maxPossible = this.calculateMaxPossible(matchedRules);
    
    // Step 4: Calculate coverage factor
    const coverage = this.calculateCoverage(facts, domainId);
    const coverageFactor = (this.config.coverageWeight * coverage) + (1 - this.config.coverageWeight);
    
    // Step 5: Calculate raw score
    const rawScore = maxPossible > 0 ? totalPositive / maxPossible : 0;
    
    // Step 6: Apply coverage factor and clamp
    const confidence = Math.min(1, Math.max(0, rawScore * coverageFactor));
    
    // Step 7: Create detailed breakdown for explainability
    const breakdown = {
      confidence: Math.round(confidence * 1000) / 1000, // Round to 3 decimal places
      totalPositive: Math.round(totalPositive * 1000) / 1000,
      maxPossible: Math.round(maxPossible * 1000) / 1000, 
      rawScore: Math.round(rawScore * 1000) / 1000,
      coverage: Math.round(coverage * 1000) / 1000,
      coverageFactor: Math.round(coverageFactor * 1000) / 1000,
      ruleScores: ruleScores,
      rulesConsidered: matchedRules.length,
      algorithm: 'robust_v1'
    };
    
    // Log confidence calculation
    logInferencePipeline.confidenceCalculated(sessionId, breakdown);
    
    return { confidence, breakdown };
  }
  
  /**
   * Calculate individual rule contributions
   * @param {Array} matchedRules - Array of matched rule objects
   * @returns {Array} - Array of rule score objects
   */
  calculateRuleScores(matchedRules) {
    return matchedRules.map(matchedRule => {
      const rule = matchedRule.rule || matchedRule;
      
      // Get normalized base weight (author-assigned, 1-10 → 0-1)
      const baseWeight = (rule.weight || rule.baseWeight || 5) / 10;
      
      // Get priority factor
      const priorityFactor = this.getPriorityFactor(rule.priority);
      
      // Get match strength (how many conditions matched vs total)
      const matchStrength = this.calculateMatchStrength(matchedRule);
      
      // Calculate rule contribution
      const contribution = baseWeight * priorityFactor * matchStrength;
      
      return {
        ruleId: rule.id || rule._id || 'unknown',
        title: rule.title || rule.name || 'Untitled Rule',
        baseWeight: Math.round(baseWeight * 1000) / 1000,
        priorityFactor: Math.round(priorityFactor * 1000) / 1000, 
        matchStrength: Math.round(matchStrength * 1000) / 1000,
        contribution: Math.round(contribution * 1000) / 1000,
        priority: rule.priority
      };
    });
  }
  
  /**
   * Get priority factor for a rule priority
   * @param {String|Number} priority - Rule priority
   * @returns {Number} - Priority multiplier
   */
  getPriorityFactor(priority) {
    if (typeof priority === 'string') {
      return this.priorityFactors[priority.toLowerCase()] || 1.0;
    }
    if (typeof priority === 'number') {
      return this.priorityFactors[priority] || 1.0;
    }
    return 1.0; // Default
  }
  
  /**
   * Calculate match strength for a matched rule
   * @param {Object} matchedRule - Matched rule object with match data
   * @returns {Number} - Match strength between 0 and 1
   */
  calculateMatchStrength(matchedRule) {
    // If explicit match strength is provided, use it
    if (matchedRule.matchStrength !== undefined) {
      return Math.min(1, Math.max(0, matchedRule.matchStrength));
    }
    
    // If match details are provided, calculate from conditions
    if (matchedRule.matchDetails) {
      const { matchedConditions, totalConditions } = matchedRule.matchDetails;
      if (totalConditions > 0) {
        return matchedConditions / totalConditions;
      }
    }
    
    // If rule has conditions array, check how many matched
    const rule = matchedRule.rule || matchedRule;
    if (rule.conditions && Array.isArray(rule.conditions)) {
      const totalConditions = rule.conditions.length;
      const matchedConditions = matchedRule.matchedConditionsCount || totalConditions;
      return totalConditions > 0 ? matchedConditions / totalConditions : 1.0;
    }
    
    // Default: assume full match if no match data available
    return 1.0;
  }
  
  /**
   * Calculate theoretical maximum possible score
   * @param {Array} matchedRules - Array of matched rules
   * @returns {Number} - Maximum possible score
   */
  calculateMaxPossible(matchedRules) {
    return matchedRules.reduce((sum, matchedRule) => {
      const rule = matchedRule.rule || matchedRule;
      const baseWeight = (rule.weight || rule.baseWeight || 5) / 10;
      const priorityFactor = this.getPriorityFactor(rule.priority);
      return sum + (baseWeight * priorityFactor * 1.0); // Assume perfect match
    }, 0);
  }
  
  /**
   * Calculate coverage factor based on decisive facts
   * @param {Object} facts - Normalized facts object
   * @param {String} domainId - Domain identifier
   * @returns {Number} - Coverage ratio between 0 and 1
   */
  calculateCoverage(facts, domainId) {
    const decisiveFacts = this.decisiveFactsByDomain[domainId] || 
                          this.decisiveFactsByDomain['web-development']; // Default
    
    if (decisiveFacts.length === 0) return 1.0;
    
    const factsMatched = decisiveFacts.filter(factKey => {
      const factValue = facts[factKey];
      return factValue !== undefined && factValue !== null && factValue !== '';
    }).length;
    
    return factsMatched / decisiveFacts.length;
  }
  
  /**
   * Compare old vs new confidence for testing
   * @param {Number} oldConfidence - Old confidence score
   * @param {Object} newResult - New calculation result
   * @param {String} sessionId - Session ID for logging  
   */
  compareConfidenceScores(oldConfidence, newResult, sessionId) {
    const diff = Math.abs(newResult.confidence - oldConfidence);
    const percentChange = oldConfidence > 0 ? (diff / oldConfidence) * 100 : 0;
    
    const comparison = {
      sessionId,
      oldConfidence: Math.round(oldConfidence * 1000) / 1000,
      newConfidence: newResult.confidence,
      difference: Math.round(diff * 1000) / 1000,
      percentChange: Math.round(percentChange * 100) / 100,
      algorithm: newResult.breakdown.algorithm,
      timestamp: new Date().toISOString()
    };
    
    // Log comparison for analysis
    console.log('Confidence comparison:', comparison);
    
    return comparison;
  }
}

module.exports = ConfidenceCalculator;