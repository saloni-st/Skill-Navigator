const { RuleEngine, FactNormalizationService } = require('../src/services/InferenceEngine');

/**
 * Phase 3 - Inference Unit Tests
 * Tests for rule operators and fact normalization
 */
describe('Inference Engine - Operators', () => {
  let engine;

  beforeEach(() => {
    engine = new RuleEngine();
  });

  describe('Operator Tests - eq (equals)', () => {
    it('should match exact string values', () => {
      const facts = { experienceLevel: 'beginner' };
      const condition = { field: 'experienceLevel', operator: 'eq', value: 'beginner' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match different string values', () => {
      const facts = { experienceLevel: 'intermediate' };
      const condition = { field: 'experienceLevel', operator: 'eq', value: 'beginner' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should match exact numeric values', () => {
      const facts = { experienceYears: 2 };
      const condition = { field: 'experienceYears', operator: 'eq', value: 2 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });
  });

  describe('Operator Tests - neq (not equals)', () => {
    it('should match when values are different', () => {
      const facts = { experienceLevel: 'intermediate' };
      const condition = { field: 'experienceLevel', operator: 'neq', value: 'beginner' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when values are same', () => {
      const facts = { experienceLevel: 'beginner' };
      const condition = { field: 'experienceLevel', operator: 'neq', value: 'beginner' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });
  });

  describe('Operator Tests - gte (greater than or equal)', () => {
    it('should match when value is greater', () => {
      const facts = { experienceYears: 5 };
      const condition = { field: 'experienceYears', operator: 'gte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should match when value is equal', () => {
      const facts = { experienceYears: 3 };
      const condition = { field: 'experienceYears', operator: 'gte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when value is less', () => {
      const facts = { experienceYears: 1 };
      const condition = { field: 'experienceYears', operator: 'gte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should handle weekly hours threshold', () => {
      const facts = { studyHours: 15 };
      const condition = { field: 'studyHours', operator: 'gte', value: 10 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });
  });

  describe('Operator Tests - lte (less than or equal)', () => {
    it('should match when value is less', () => {
      const facts = { experienceYears: 1 };
      const condition = { field: 'experienceYears', operator: 'lte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should match when value is equal', () => {
      const facts = { experienceYears: 3 };
      const condition = { field: 'experienceYears', operator: 'lte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when value is greater', () => {
      const facts = { experienceYears: 5 };
      const condition = { field: 'experienceYears', operator: 'lte', value: 3 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });
  });

  describe('Operator Tests - contains', () => {
    it('should match when array contains value', () => {
      const facts = { interests: ['frontend', 'backend', 'mobile'] };
      const condition = { field: 'interests', operator: 'contains', value: 'frontend' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when array does not contain value', () => {
      const facts = { interests: ['backend', 'mobile'] };
      const condition = { field: 'interests', operator: 'contains', value: 'frontend' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should match substring in string field', () => {
      const facts = { primaryGoal: 'career_change_to_tech' };
      const condition = { field: 'primaryGoal', operator: 'contains', value: 'career_change' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });
  });

  describe('Operator Tests - in', () => {
    it('should match when value is in array', () => {
      const facts = { experienceLevel: 'intermediate' };
      const condition = { field: 'experienceLevel', operator: 'in', value: ['beginner', 'intermediate', 'advanced'] };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when value is not in array', () => {
      const facts = { experienceLevel: 'expert' };
      const condition = { field: 'experienceLevel', operator: 'in', value: ['beginner', 'intermediate', 'advanced'] };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should handle commitment level validation', () => {
      const facts = { commitmentLevel: 'serious' };
      const condition = { field: 'commitmentLevel', operator: 'in', value: ['consistent', 'serious', 'intensive'] };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });
  });

  describe('Operator Tests - regex', () => {
    it('should match pattern in string field', () => {
      const facts = { primaryGoal: 'switch_to_web_development' };
      const condition = { field: 'primaryGoal', operator: 'regex', value: 'web.*development' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });

    it('should not match when pattern does not match', () => {
      const facts = { primaryGoal: 'learn_mobile_apps' };
      const condition = { field: 'primaryGoal', operator: 'regex', value: 'web.*development' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should handle case-insensitive regex', () => {
      const facts = { educationLevel: 'Bachelor' };
      const condition = { field: 'educationLevel', operator: 'regex', value: '(?i)bachelor|masters|phd' };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(true);
      expect(result.matchStrength).toBe(1.0);
    });
  });

  describe('Fact Normalization', () => {
    it('should normalize questionnaire answers correctly', () => {
      const rawAnswers = {
        education_level: 'bachelors',
        coding_experience: '1',
        weekly_hours: '15',
        primary_goal: 'career_change',
        interests: ['frontend', 'mobile']
      };

      const facts = FactNormalizationService.normalizeAnswers(rawAnswers);

      expect(facts.educationLevel).toBe('bachelors');
      expect(facts.experienceLevel).toBe('beginner');
      expect(facts.experienceYears).toBe(0.5);
      expect(facts.studyHours).toBe(15);
      expect(facts.commitmentLevel).toBe('consistent');
      expect(facts.primaryGoal).toBe('career_change');
      expect(facts.interests).toEqual(['frontend', 'mobile']);
    });

    it('should handle edge cases in normalization', () => {
      const rawAnswers = {
        education_level: 'unknown',
        coding_experience: '5+',
        weekly_hours: '40'
      };

      const facts = FactNormalizationService.normalizeAnswers(rawAnswers);

      expect(facts.educationLevel).toBe('unknown');
      expect(facts.experienceLevel).toBe('advanced');
      expect(facts.experienceYears).toBe(6);
      expect(facts.studyHours).toBe(40);
      expect(facts.commitmentLevel).toBe('intensive');
    });
  });

  describe('Complex Condition Evaluation', () => {
    it('should handle missing fields gracefully', () => {
      const facts = { experienceLevel: 'beginner' }; // Missing experienceYears
      const condition = { field: 'experienceYears', operator: 'gte', value: 2 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
    });

    it('should handle null and undefined values', () => {
      const facts = { experienceLevel: null, studyHours: undefined };
      
      const condition1 = { field: 'experienceLevel', operator: 'eq', value: 'beginner' };
      const result1 = engine.evaluateCondition(condition1, facts);
      expect(result1.matches).toBe(false);

      const condition2 = { field: 'studyHours', operator: 'gte', value: 10 };
      const result2 = engine.evaluateCondition(condition2, facts);
      expect(result2.matches).toBe(false);
    });

    it('should provide match strength for partial matches where applicable', () => {
      // This test assumes some operators might return partial match strength in future
      const facts = { experienceYears: 1.5 };
      const condition = { field: 'experienceYears', operator: 'gte', value: 2 };
      
      const result = engine.evaluateCondition(condition, facts);
      expect(result.matches).toBe(false);
      expect(result.matchStrength).toBe(0.0);
      expect(result.actualValue).toBe(1.5);
      expect(result.expectedValue).toBe(2);
    });
  });
});