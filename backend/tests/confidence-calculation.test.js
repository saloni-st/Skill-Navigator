const ConfidenceCalculator = require('../src/services/ConfidenceCalculator');

/**
 * Phase 3 - Confidence Calculation Tests
 * Tests for deterministic confidence function from Phase 1
 */
describe('ConfidenceCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
  });

  describe('Basic Confidence Calculation', () => {
    it('should compute expected confidence for single high-priority rule', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'rule_1',
            title: 'High Priority Rule',
            priority: 'high',
            weight: 8 // 8/10 = 0.8 base weight
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 'part-time', 
        learningPreference: 'visual',
        goal: 'career_change',
        timeframe: '6_months',
        educationLevel: 'bachelors'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      // Expected: baseWeight(0.8) * priorityFactor(1.2) * matchStrength(1.0) = 0.96
      // maxPossible = 0.96, coverage = 1.0 (all decisive facts provided)
      // confidence = (0.96 / 0.96) * 1.0 = 1.0
      expect(result.confidence).toBeCloseTo(1.0, 2);
      expect(result.breakdown.totalPositive).toBeCloseTo(0.96, 2);
      expect(result.breakdown.maxPossible).toBeCloseTo(0.96, 2);
      expect(result.breakdown.coverage).toBeCloseTo(1.0, 2);
    });

    it('should compute expected confidence for multiple rules with different priorities', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'rule_high',
            title: 'High Priority Rule',
            priority: 'high',
            weight: 8 // 0.8 * 1.2 = 0.96
          },
          matched: true,
          matchStrength: 1.0
        },
        {
          rule: {
            _id: 'rule_medium',  
            title: 'Medium Priority Rule',
            priority: 'medium',
            weight: 7 // 0.7 * 1.0 = 0.7
          },
          matched: true,
          matchStrength: 0.8
        },
        {
          rule: {
            _id: 'rule_low',
            title: 'Low Priority Rule', 
            priority: 'low',
            weight: 6 // 0.6 * 0.8 = 0.48
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      const facts = {
        experienceLevel: 'intermediate',
        timeAvailability: 'full-time',
        learningPreference: 'hands-on',
        goal: 'skill_improvement'
        // Missing some decisive facts - should impact coverage
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      // Expected contributions: 0.96 + 0.56 + 0.48 = 2.0
      // maxPossible: 0.96 + 0.7 + 0.48 = 2.14
      // coverage: 4/6 = 0.67 (4 decisive facts provided out of 6)
      // rawScore = 2.0 / 2.14 = 0.93
      // confidence = 0.93 * coverageFactor (around 0.87) ≈ 0.81
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.breakdown.rulesConsidered).toBe(3);
    });

    it('should handle partial match strengths correctly', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'rule_partial',
            title: 'Partially Matched Rule',
            priority: 'high',
            weight: 10 // 1.0 * 1.2 = 1.2 max
          },
          matched: true,
          matchStrength: 0.6 // Only 60% match
        }
      ];

      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 'part-time',
        learningPreference: 'visual',
        goal: 'exploration',
        timeframe: '3_months',
        educationLevel: 'high_school'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      // Expected: 1.0 * 1.2 * 0.6 = 0.72 contribution
      // maxPossible: 1.0 * 1.2 * 1.0 = 1.2
      // coverage: 1.0 (all decisive facts)
      // confidence = (0.72 / 1.2) * 1.0 = 0.6
      expect(result.confidence).toBeCloseTo(0.6, 2);
      expect(result.breakdown.totalPositive).toBeCloseTo(0.72, 2);
      expect(result.breakdown.coverage).toBeCloseTo(1.0, 2);
    });
  });

  describe('Boundary Tests', () => {
    it('should return zero confidence when no rules matched', () => {
      const matchedRules = [];

      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 'part-time',
        learningPreference: 'visual'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.confidence).toBe(0);
      expect(result.breakdown.totalPositive).toBe(0);
      expect(result.breakdown.maxPossible).toBe(0);
      expect(result.breakdown.rulesConsidered).toBe(0);
    });

    it('should approach maximum confidence for many high-scoring matches', () => {
      const matchedRules = [];
      
      // Create 5 high-scoring rules
      for (let i = 0; i < 5; i++) {
        matchedRules.push({
          rule: {
            _id: `rule_${i}`,
            title: `High Scoring Rule ${i}`,
            priority: 'high',
            weight: 9 // 0.9 * 1.2 = 1.08 each
          },
          matched: true,
          matchStrength: 1.0
        });
      }

      const facts = {
        experienceLevel: 'advanced',
        timeAvailability: 'full-time',
        learningPreference: 'self-directed',
        goal: 'mastery',
        timeframe: '1_year',
        educationLevel: 'masters'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      // With perfect coverage and high-scoring rules, should be very high
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.breakdown.rulesConsidered).toBe(5);
    });

    it('should handle confidence capping at 1.0', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'perfect_rule',
            title: 'Perfect Match Rule',
            priority: 'high',
            weight: 10 // Maximum weight
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      const facts = {
        experienceLevel: 'expert',
        timeAvailability: 'full-time',
        learningPreference: 'project-based',
        goal: 'teaching',
        timeframe: 'ongoing',
        educationLevel: 'phd'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle minimum confidence floor', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'weak_rule',
            title: 'Very Weak Rule',
            priority: 'low',
            weight: 1 // Minimum weight: 0.1 * 0.8 = 0.08
          },
          matched: true,
          matchStrength: 0.1 // Very weak match
        }
      ];

      const facts = {
        experienceLevel: 'beginner'
        // Minimal facts - low coverage
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.confidence).toBeGreaterThanOrEqual(0.0);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.breakdown.totalPositive).toBeCloseTo(0.008, 3); // 0.1 * 0.8 * 0.1
    });
  });

  describe('Priority Factor Mapping', () => {
    it('should apply correct priority factors', () => {
      const testCases = [
        { priority: 'high', expectedFactor: 1.2 },
        { priority: 'medium', expectedFactor: 1.0 },
        { priority: 'low', expectedFactor: 0.8 }
      ];

      testCases.forEach(({ priority, expectedFactor }) => {
        const matchedRules = [
          {
            rule: {
              _id: `rule_${priority}`,
              title: `${priority} Priority Rule`,
              priority: priority,
              weight: 10 // Use max weight to see priority factor clearly
            },
            matched: true,
            matchStrength: 1.0
          }
        ];

        const facts = {
          experienceLevel: 'intermediate',
          timeAvailability: 'part-time',
          learningPreference: 'visual',
          goal: 'testing',
          timeframe: '6_months',
          educationLevel: 'bachelors'
        };

        const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');
        
        // Expected contribution: 1.0 * priorityFactor * 1.0 = priorityFactor
        expect(result.breakdown.totalPositive).toBeCloseTo(expectedFactor, 2);
      });
    });
  });

  describe('Coverage Calculation', () => {
    it('should calculate coverage based on decisive facts provided', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'test_rule',
            title: 'Test Rule',
            priority: 'medium',
            weight: 5 // 0.5 * 1.0 = 0.5
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      // Test different coverage scenarios
      const testCases = [
        { 
          facts: {}, 
          expectedCoverage: 0.0 // 0/6 decisive facts
        },
        { 
          facts: { 
            experienceLevel: 'beginner', 
            timeAvailability: 'part-time', 
            learningPreference: 'visual' 
          }, 
          expectedCoverage: 0.5 // 3/6 decisive facts
        },
        { 
          facts: {
            experienceLevel: 'intermediate',
            timeAvailability: 'full-time',
            learningPreference: 'hands-on',
            goal: 'career_change',
            timeframe: '6_months',
            educationLevel: 'bachelors'
          }, 
          expectedCoverage: 1.0 // 6/6 decisive facts
        }
      ];

      testCases.forEach(({ facts, expectedCoverage }) => {
        const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');
        expect(result.breakdown.coverage).toBeCloseTo(expectedCoverage, 2);
      });
    });
  });

  describe('Rule Score Breakdown', () => {
    it('should include detailed breakdown for each rule', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'detailed_rule',
            title: 'Detailed Rule',
            priority: 'high',
            weight: 8 // 0.8 base weight
          },
          matched: true,
          matchStrength: 0.9
        }
      ];

      const facts = {
        experienceLevel: 'advanced',
        timeAvailability: 'full-time',
        learningPreference: 'project-based',
        goal: 'detailed_test',
        timeframe: '1_year',
        educationLevel: 'masters'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.breakdown.ruleScores).toBeDefined();
      expect(result.breakdown.ruleScores).toHaveLength(1);
      
      const ruleScore = result.breakdown.ruleScores[0];
      expect(ruleScore.ruleId).toBe('detailed_rule');
      expect(ruleScore.title).toBe('Detailed Rule');
      expect(ruleScore.baseWeight).toBeCloseTo(0.8, 2);
      expect(ruleScore.priorityFactor).toBeCloseTo(1.2, 2);
      expect(ruleScore.matchStrength).toBeCloseTo(0.9, 2);
      expect(ruleScore.contribution).toBeCloseTo(0.864, 3); // 0.8 * 1.2 * 0.9
    });

    it('should include algorithm metadata in breakdown', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'meta_rule',
            title: 'Metadata Rule',
            priority: 'medium',
            weight: 5
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      const facts = {
        experienceLevel: 'intermediate',
        timeAvailability: 'part-time'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.breakdown.algorithm).toBe('robust_v1');
      expect(result.breakdown.rulesConsidered).toBe(1);
      expect(result.breakdown.rawScore).toBeDefined();
      expect(result.breakdown.coverageFactor).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle rules with missing properties gracefully', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'valid_rule',
            title: 'Valid Rule',
            priority: 'high',
            weight: 8
          },
          matched: true,
          matchStrength: 1.0
        },
        {
          // Missing rule properties - should use defaults
          rule: {
            _id: 'incomplete_rule'
          },
          matched: true
        }
      ];

      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 'part-time'
      };

      const result = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.rulesConsidered).toBe(2);
    });

    it('should handle null or undefined inputs gracefully', () => {
      const facts = {
        experienceLevel: 'beginner',
        timeAvailability: 'part-time'
      };

      expect(() => calculator.calculateConfidence(null, facts, 'web-development', 'test-session')).toThrow();
      expect(() => calculator.calculateConfidence(undefined, facts, 'web-development', 'test-session')).toThrow();
      
      // Empty array should work
      const result = calculator.calculateConfidence([], facts, 'web-development', 'test-session');
      expect(result.confidence).toBe(0);
      expect(result.breakdown.rulesConsidered).toBe(0);
    });

    it('should maintain deterministic results for identical inputs', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'deterministic_rule',
            title: 'Deterministic Rule',
            priority: 'high',
            weight: 8
          },
          matched: true,
          matchStrength: 0.75
        }
      ];

      const facts = {
        experienceLevel: 'intermediate',
        timeAvailability: 'full-time',
        learningPreference: 'hands-on',
        goal: 'deterministic_test'
      };

      const result1 = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session-1');
      const result2 = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session-2');
      const result3 = calculator.calculateConfidence(matchedRules, facts, 'web-development', 'test-session-3');

      expect(result1.confidence).toEqual(result2.confidence);
      expect(result2.confidence).toEqual(result3.confidence);
      expect(result1.breakdown.totalPositive).toEqual(result2.breakdown.totalPositive);
      expect(result2.breakdown.totalPositive).toEqual(result3.breakdown.totalPositive);
    });
  });

  describe('Domain-specific Coverage', () => {
    it('should use different decisive facts for different domains', () => {
      const matchedRules = [
        {
          rule: {
            _id: 'domain_rule',
            title: 'Domain Rule',
            priority: 'medium',
            weight: 5
          },
          matched: true,
          matchStrength: 1.0
        }
      ];

      // Web dev facts: matches 4/6 web-development decisive facts
      const webDevFacts = {
        experienceLevel: 'intermediate',      // ✓ matches web-dev
        timeAvailability: 'full-time',        // ✓ matches web-dev  
        learningPreference: 'hands-on',       // ✓ matches web-dev
        goal: 'career_change'                 // ✓ matches web-dev
        // Missing: timeframe, educationLevel
      };

      // Data sci facts: matches 3/6 data-science decisive facts  
      const dataSciFacts = {
        experienceLevel: 'intermediate',      // ✓ matches data-sci
        mathBackground: 'strong',             // ✓ matches data-sci
        programmingExperience: 'moderate'     // ✓ matches data-sci
        // Missing: timeAvailability, goal, industryExperience
      };

      const webResult = calculator.calculateConfidence(matchedRules, webDevFacts, 'web-development', 'test-session');
      const dataResult = calculator.calculateConfidence(matchedRules, dataSciFacts, 'data-science', 'test-session');

      // Web-dev should have coverage 4/6 = 0.67, data-sci should have coverage 3/6 = 0.5
      expect(webResult.breakdown.coverage).toBeCloseTo(0.67, 2);
      expect(dataResult.breakdown.coverage).toBeCloseTo(0.5, 2);
      expect(webResult.breakdown.coverage).not.toEqual(dataResult.breakdown.coverage);
      expect(webResult.confidence).not.toEqual(dataResult.confidence);
    });
  });
});