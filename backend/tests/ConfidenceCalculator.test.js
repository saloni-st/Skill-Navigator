const ConfidenceCalculator = require('../src/services/ConfidenceCalculator');

describe('ConfidenceCalculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });
  
  describe('calculateConfidence', () => {
    it('should return 0 confidence for no matched rules', () => {
      const facts = { experienceLevel: 'beginner', timeAvailability: 10 };
      const result = calculator.calculateConfidence([], facts, 'web-development', 'test-session');
      
      expect(result.confidence).toBe(0);
      expect(result.breakdown.rulesConsidered).toBe(0);
    });
    
    it('should calculate confidence for single high-priority rule with full match', () => {
      const matchedRules = [{
        rule: {
          id: 'rule1',
          title: 'Beginner Path',
          weight: 8,
          priority: 'high',
          conditions: ['experience == beginner', 'timeAvailable > 10']
        },
        matchStrength: 1.0
      }];
      
      const facts = { 
        experienceLevel: 'beginner', 
        timeAvailability: 15,
        learningPreference: 'structured',
        goal: 'career_change' 
      };
      
      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');
      
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.breakdown.ruleScores).toHaveLength(1);
      expect(result.breakdown.ruleScores[0].priorityFactor).toBe(1.2); // High priority
      expect(result.breakdown.ruleScores[0].matchStrength).toBe(1.0);
    });
    
    it('should calculate lower confidence for partial matches', () => {
      const matchedRules = [{
        rule: {
          id: 'rule2', 
          title: 'Partial Match Rule',
          weight: 6,
          priority: 'medium',
          conditions: ['exp == intermediate', 'time > 20', 'goal == career']
        },
        matchStrength: 0.5 // Only 50% of conditions matched
      }];
      
      const facts = { 
        experienceLevel: 'intermediate',
        timeAvailability: 8 // Doesn't match time > 20
      };
      
      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');
      
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.breakdown.ruleScores[0].matchStrength).toBe(0.5);
    });
    
    it('should handle multiple rules with different priorities', () => {
      const matchedRules = [
        {
          rule: {
            id: 'high-rule',
            title: 'High Priority Rule', 
            weight: 9,
            priority: 'high'
          },
          matchStrength: 1.0
        },
        {
          rule: {
            id: 'low-rule',
            title: 'Low Priority Rule',
            weight: 4, 
            priority: 'low'
          },
          matchStrength: 0.8
        }
      ];
      
      const facts = { 
        experienceLevel: 'beginner',
        timeAvailability: 15,
        learningPreference: 'hands-on',
        goal: 'skill_building',
        timeframe: 'medium_term',
        educationLevel: 'bachelors'
      };
      
      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');
      
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.breakdown.ruleScores).toHaveLength(2);
      
      const highRule = result.breakdown.ruleScores.find(r => r.ruleId === 'high-rule');
      const lowRule = result.breakdown.ruleScores.find(r => r.ruleId === 'low-rule');
      
      expect(highRule.priorityFactor).toBe(1.2);
      expect(lowRule.priorityFactor).toBe(0.8);
      expect(highRule.contribution).toBeGreaterThan(lowRule.contribution);
    });
  });
  
  describe('calculateCoverage', () => {
    it('should calculate full coverage when all decisive facts are present', () => {
      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 15,
        learningPreference: 'structured', 
        goal: 'career_change',
        timeframe: 'medium_term',
        educationLevel: 'bachelors'
      };
      
      const coverage = calculator.calculateCoverage(facts, 'web-development');
      expect(coverage).toBe(1.0);
    });
    
    it('should calculate partial coverage when some decisive facts are missing', () => {
      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 15
        // Missing other decisive facts
      };
      
      const coverage = calculator.calculateCoverage(facts, 'web-development');
      expect(coverage).toBeLessThan(1.0);
      expect(coverage).toBeGreaterThan(0);
    });
  });
  
  describe('getPriorityFactor', () => {
    it('should return correct factors for string priorities', () => {
      expect(calculator.getPriorityFactor('high')).toBe(1.2);
      expect(calculator.getPriorityFactor('medium')).toBe(1.0);
      expect(calculator.getPriorityFactor('low')).toBe(0.8);
    });
    
    it('should return correct factors for numeric priorities', () => {
      expect(calculator.getPriorityFactor(10)).toBe(1.2);
      expect(calculator.getPriorityFactor(7)).toBe(1.0);
      expect(calculator.getPriorityFactor(3)).toBe(0.8);
    });
    
    it('should return default factor for unknown priorities', () => {
      expect(calculator.getPriorityFactor('unknown')).toBe(1.0);
      expect(calculator.getPriorityFactor(null)).toBe(1.0);
    });
  });
  
  describe('calculateMatchStrength', () => {
    it('should use explicit match strength when provided', () => {
      const matchedRule = { matchStrength: 0.75 };
      expect(calculator.calculateMatchStrength(matchedRule)).toBe(0.75);
    });
    
    it('should calculate from match details when available', () => {
      const matchedRule = {
        matchDetails: {
          matchedConditions: 3,
          totalConditions: 4
        }
      };
      expect(calculator.calculateMatchStrength(matchedRule)).toBe(0.75);
    });
    
    it('should default to 1.0 when no match data available', () => {
      const matchedRule = { rule: { id: 'test' } };
      expect(calculator.calculateMatchStrength(matchedRule)).toBe(1.0);
    });
  });
  
  describe('determinism and reproducibility', () => {
    it('should return identical results for identical inputs', () => {
      const matchedRules = [{
        rule: {
          id: 'test-rule',
          weight: 7,
          priority: 'medium'
        },
        matchStrength: 0.8
      }];
      
      const facts = { experienceLevel: 'intermediate' };
      
      const result1 = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'session1');
      const result2 = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'session2');
      
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.breakdown.totalPositive).toBe(result2.breakdown.totalPositive);
    });
  });
  
  describe('edge cases', () => {
    it('should handle rules with missing weight/priority gracefully', () => {
      const matchedRules = [{
        rule: { id: 'incomplete-rule' } // No weight or priority
      }];
      
      const facts = { experienceLevel: 'beginner' };
      
      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test');
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.breakdown.ruleScores[0].baseWeight).toBe(0.5); // Default weight 5/10
      expect(result.breakdown.ruleScores[0].priorityFactor).toBe(1.0); // Default priority
    });
  });
});