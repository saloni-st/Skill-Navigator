const { RuleEngine } = require('../src/services/InferenceEngine');
const { Domain, Rule } = require('../src/models');

/**
 * Phase 3 - Rule Match Tests
 * Tests exact    it('should match backend specialization for intermediate with backend interest', asy    it('should return correct actions for matched backend rule', async () => {
      const rawAnswers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        interests: 'backend',       // interests: 'backend'
        weekly_hours: '18',         // studyHours: 18, commitmentLevel: 'consistent'
        web_dev_focus: 'backend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-7');{
      cons    it('should combine actions from multiple matched rules', async () => {
      const rawAnswers = {
        coding_experience: '1',     // experienceLevel: 'beginner' 
        career_goal: 'career_change',  // primaryGoal: 'career_change'
        weekly_hours: '15',         // studyHours: 15, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-8');ers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        interests: 'backend',       // interests: 'backend'
        weekly_hours: '20',         // studyHours: 20, commitmentLevel: 'serious'
        web_dev_focus: 'backend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-3');matching and actions returned for given facts
 */
describe('Inference Engine - Rule Matching', () => {
  let engine;
  let testDomainId;
  
  // Mock rules for testing
  const mockRules = [
    {
      _id: 'rule_beginner_web_dev',
      title: 'Complete Beginner Web Development Path',
      domainId: null, // Will be set in beforeEach
      priority: 'high',
      weight: 0.9,
      isActive: true,
      conditions: {
        experienceLevel: 'absolute_beginner',
        primaryGoal: 'learn_web_development'
      },
      action: {
        skills: ['HTML basics', 'CSS fundamentals', 'JavaScript introduction'],
        timeline: '16 weeks for complete beginner',
        difficulty: 'beginner'
      }
    },
    {
      _id: 'rule_consistent_learner',
      title: 'Consistent Learner Bonus',
      domainId: null,
      priority: 'medium',
      weight: 0.7,
      isActive: true,
      conditions: {
        commitmentLevel: ['consistent', 'serious', 'intensive'],
        studyHours: '>=10'
      },
      action: {
        skills: ['Advanced projects', 'Code reviews'],
        timeline: 'Accelerated timeline',
        difficulty: 'intermediate'
      }
    },
    {
      _id: 'rule_career_changer',
      title: 'Career Change Support',
      domainId: null,
      priority: 'high',
      weight: 0.8,
      isActive: true,
      conditions: {
        primaryGoal: 'career_change',
        experienceLevel: ['absolute_beginner', 'beginner']
      },
      action: {
        skills: ['Professional portfolio', 'Interview preparation', 'Networking'],
        timeline: '20 weeks with career support',
        difficulty: 'beginner-to-intermediate'
      }
    },
    {
      _id: 'rule_backend_focus',
      title: 'Backend Development Specialization',
      domainId: null,
      priority: 'medium',
      weight: 0.8,
      isActive: true,
      conditions: {
        interests: 'backend',
        experienceLevel: ['beginner', 'intermediate', 'advanced'] // neq absolute_beginner
      },
      action: {
        skills: ['Node.js', 'Databases', 'API design', 'Server deployment'],
        timeline: '14 weeks backend focus',
        difficulty: 'intermediate'
      }
    },
    {
      _id: 'rule_high_commitment',
      title: 'Intensive Learning Track',
      domainId: null,
      priority: 'low',
      weight: 0.6,
      isActive: true,
      conditions: {
        commitmentLevel: 'intensive',
        studyHours: '>=25'
      },
      action: {
        skills: ['Advanced patterns', 'Performance optimization', 'System design'],
        timeline: '8 weeks intensive',
        difficulty: 'advanced'
      }
    }
  ];

  beforeEach(() => {
    engine = new RuleEngine();
    testDomainId = 'test_domain_web_dev';
    
    // Set domain ID for all mock rules
    mockRules.forEach(rule => {
      rule.domainId = testDomainId;
    });

    // Mock the Rule.find method to return a chainable query object
    const mockQuery = {
      sort: jest.fn().mockResolvedValue(mockRules)
    };
    jest.spyOn(Rule, 'find').mockReturnValue(mockQuery);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Exact Rule ID Matching', () => {
    it('should match beginner web development rule for absolute beginner', async () => {
      // Use raw answers that will be normalized by infer() method
      const rawAnswers = {
        coding_experience: '0',      // normalizes to experienceLevel: 'absolute_beginner'
        primary_goal: 'web_development',  // normalizes to primaryGoal: 'web_development'  
        weekly_hours: '10',          // normalizes to studyHours: 10, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      console.log('DEBUG: Raw answers:', rawAnswers);
      console.log('DEBUG: Rules available:', engine.rules?.map(r => r._id) || 'NO RULES');

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-1');
      
      console.log('DEBUG: Normalized facts:', result.facts);
      console.log('DEBUG: Full trace length:', result.trace.length);
      console.log('DEBUG: Rule traces:', result.trace.filter(t => t.step === 'rule_evaluation').length);
      
      console.log('DEBUG: Full trace:', JSON.stringify(result.trace, null, 2));
      
      const matchedRuleIds = result.trace
        .filter(trace => trace.matched)
        .map(trace => trace.rule._id);

      console.log('DEBUG: Matched rule IDs:', matchedRuleIds);

      expect(matchedRuleIds).toContain('rule_beginner_web_dev');
      expect(matchedRuleIds).toContain('rule_consistent_learner');
      expect(matchedRuleIds).not.toContain('rule_backend_focus'); // Should not match - beginner
      expect(matchedRuleIds).not.toContain('rule_high_commitment'); // Should not match - not intensive
    });

    it('should match career changer rules for beginner seeking career change', async () => {
      const rawAnswers = {
        coding_experience: '1',     // experienceLevel: 'beginner'
        career_goal: 'career_change',  // This should map to career change goals
        weekly_hours: '15',         // studyHours: 15, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-2');
      
      const matchedRuleIds = result.trace
        .filter(trace => trace.matched)
        .map(trace => trace.rule._id);

      expect(matchedRuleIds).toContain('rule_career_changer');
      expect(matchedRuleIds).toContain('rule_consistent_learner');
      expect(matchedRuleIds).not.toContain('rule_beginner_web_dev'); // Primary goal doesn't contain 'web'
    });

    it('should match backend specialization for intermediate with backend interest', async () => {
      const rawAnswers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        interests: 'backend',       // interests: 'backend'
        weekly_hours: '20',         // studyHours: 20, commitmentLevel: 'serious'
        web_dev_focus: 'backend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-3');
      
      const matchedRuleIds = result.trace
        .filter(trace => trace.matched)
        .map(trace => trace.rule._id);

      expect(matchedRuleIds).toContain('rule_backend_focus');
      expect(matchedRuleIds).toContain('rule_consistent_learner');
      expect(matchedRuleIds).not.toContain('rule_beginner_web_dev'); // Not absolute beginner
      expect(matchedRuleIds).not.toContain('rule_high_commitment'); // Not intensive
    });

    it('should match intensive learning track for high commitment users', async () => {
      const rawAnswers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        weekly_hours: '30',         // studyHours: 30, commitmentLevel: 'intensive'
        interests: 'fullstack',
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-4');
      
      const matchedRuleIds = result.trace
        .filter(trace => trace.matched)
        .map(trace => trace.rule._id);

      expect(matchedRuleIds).toContain('rule_high_commitment');
      expect(matchedRuleIds).toContain('rule_consistent_learner'); // Intensive includes consistent
    });

    it('should return no matches for facts that dont match any rules', async () => {
      const rawAnswers = {
        coding_experience: '5+',    // experienceLevel: 'advanced'  
        weekly_hours: '5',          // studyHours: 5, commitmentLevel: 'casual'
        primary_goal: 'hobby',      // primaryGoal: 'hobby'
        web_dev_focus: 'frontend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-5');
      
      const matchedRuleIds = result.trace
        .filter(trace => trace.matched)
        .map(trace => trace.rule._id);

      expect(matchedRuleIds).toHaveLength(0);
      expect(result.recommendation.summary).toContain('fallback'); // Should use fallback
    });
  });

  describe('Returned Actions Verification', () => {
    it('should return correct actions for matched beginner rule', async () => {
      const rawAnswers = {
        coding_experience: '0',     // experienceLevel: 'absolute_beginner'
        primary_goal: 'web_development',  // primaryGoal: 'learn_web_development'
        weekly_hours: '12',         // studyHours: 12, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-6');
      
      const beginnerTrace = result.trace.find(trace => 
        trace.matched && trace.rule._id === 'rule_beginner_web_dev'
      );

      expect(beginnerTrace).toBeDefined();
      expect(beginnerTrace.rule.action.skills).toEqual([
        'HTML basics', 'CSS fundamentals', 'JavaScript introduction'
      ]);
      expect(beginnerTrace.rule.action.timeline).toBe('16 weeks for complete beginner');
      expect(beginnerTrace.rule.action.difficulty).toBe('beginner');
    });

    it('should return correct actions for matched backend rule', async () => {
      const rawAnswers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        interests: 'backend',       // interests: 'backend'
        weekly_hours: '18',         // studyHours: 18, commitmentLevel: 'serious'
        web_dev_focus: 'backend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-7');
      
      const backendTrace = result.trace.find(trace => 
        trace.matched && trace.rule._id === 'rule_backend_focus'
      );

      expect(backendTrace).toBeDefined();
      expect(backendTrace.rule.action.skills).toEqual([
        'Node.js', 'Databases', 'API design', 'Server deployment'
      ]);
      expect(backendTrace.rule.action.timeline).toBe('14 weeks backend focus');
      expect(backendTrace.rule.action.difficulty).toBe('intermediate');
    });

    it('should combine actions from multiple matched rules', async () => {
      const rawAnswers = {
        coding_experience: '1',     // experienceLevel: 'beginner' 
        career_goal: 'career_change',  // primaryGoal: 'career_change'
        weekly_hours: '20',         // studyHours: 20, commitmentLevel: 'serious'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-8');
      
      // Should match both career changer and consistent learner rules
      const matchedRules = result.trace.filter(trace => trace.matched);
      expect(matchedRules.length).toBeGreaterThan(1);

      const careerTrace = matchedRules.find(trace => trace.rule._id === 'rule_career_changer');
      const consistentTrace = matchedRules.find(trace => trace.rule._id === 'rule_consistent_learner');

      expect(careerTrace).toBeDefined();
      expect(consistentTrace).toBeDefined();

      // Verify recommendation combines both rule actions
      expect(result.recommendation.skills).toEqual(
        expect.arrayContaining(['Professional portfolio', 'Interview preparation', 'Advanced projects'])
      );
    });
  });

  describe('Rule Priority and Weight Verification', () => {
    it('should include rule priority and weight in trace', async () => {
      const rawAnswers = {
        coding_experience: '0',     // experienceLevel: 'absolute_beginner'
        primary_goal: 'web_development',  // primaryGoal: 'learn_web_development'
        weekly_hours: '14',         // studyHours: 14, commitmentLevel: 'consistent'
        web_dev_focus: 'frontend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-9');
      
      const beginnerTrace = result.trace.find(trace => 
        trace.matched && trace.rule._id === 'rule_beginner_web_dev'
      );

      expect(beginnerTrace).toBeDefined();
      expect(beginnerTrace.rule.priority).toBe('high');
      expect(beginnerTrace.rule.weight).toBe(0.9);
      expect(beginnerTrace.matchStrength).toBeDefined();
      expect(beginnerTrace.ruleScore).toBeDefined();
    });

    it('should calculate match strength correctly for partial matches', async () => {
      const rawAnswers = {
        coding_experience: '3',     // experienceLevel: 'intermediate'
        interests: 'backend',       // interests: 'backend'
        weekly_hours: '8',          // studyHours: 8, commitmentLevel: 'casual' (below consistent threshold)
        web_dev_focus: 'backend'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-10');
      
      // Filter to only rule-level traces
      const ruleTraces = result.trace.filter(trace => trace.step === 'rule_evaluation');
      
      const backendTrace = ruleTraces.find(trace => 
        trace.rule._id === 'rule_backend_focus'
      );
      const consistentTrace = ruleTraces.find(trace => 
        trace.rule._id === 'rule_consistent_learner'
      );

      expect(backendTrace.matched).toBe(true); // Should match (backend interest + not absolute beginner)
      expect(consistentTrace.matched).toBe(false); // Should not match (studyHours < 10)
      
      expect(backendTrace.matchStrength).toBe(1.0); // Full match on both conditions
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty facts object', async () => {
      const facts = {};

      const result = await engine.infer(testDomainId, facts, 'test-session-11');
      
      const matchedRules = result.trace.filter(trace => trace.matched);
      expect(matchedRules).toHaveLength(0);
      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.summary).toContain('fallback');
    });

    it('should handle malformed rule conditions gracefully', async () => {
      const malformedRule = {
        _id: 'rule_malformed',
        title: 'Malformed Rule',
        domainId: testDomainId,
        priority: 'high',
        weight: 0.8,
        conditions: [
          { field: 'nonexistentField', operator: 'invalid_operator', value: 'test' }
        ],
        action: {
          skills: ['Test skill'],
          timeline: 'Test timeline',
          difficulty: 'test'
        }
      };

      // Mock Rule.find for this specific test with malformed rule
      const malformedMockQuery = {
        sort: jest.fn().mockResolvedValue([...mockRules, malformedRule])
      };
      jest.spyOn(Rule, 'find').mockReturnValue(malformedMockQuery);

      const rawAnswers = {
        coding_experience: '1',     // experienceLevel: 'beginner'
        weekly_hours: '15',         // studyHours: 15, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-12');
      
      // Should handle malformed rule gracefully and continue with other rules
      expect(result).toBeDefined();
      expect(result.trace).toBeDefined();
      
      // Filter to only rule-level traces
      const ruleTraces = result.trace.filter(trace => trace.step === 'rule_evaluation');
      const malformedTrace = ruleTraces.find(trace => trace.rule._id === 'rule_malformed');
      expect(malformedTrace.matched).toBe(false);
    });

    it('should provide detailed trace information for debugging', async () => {
      const rawAnswers = {
        coding_experience: '1',     // experienceLevel: 'beginner'
        career_goal: 'career_change',  // primaryGoal: 'career_change'
        weekly_hours: '15',         // studyHours: 15, commitmentLevel: 'consistent'
        web_dev_focus: 'fullstack'
      };

      const result = await engine.infer(testDomainId, rawAnswers, 'test-session-13');
      
      expect(result.trace).toBeDefined();
      expect(Array.isArray(result.trace)).toBe(true);
      
      // Filter to only rule-level traces for detailed validation
      const ruleTraces = result.trace.filter(trace => trace.step === 'rule_evaluation');
      expect(ruleTraces.length).toBeGreaterThan(0);
      
      ruleTraces.forEach(trace => {
        expect(trace).toHaveProperty('rule');
        expect(trace).toHaveProperty('matched');
        expect(trace).toHaveProperty('matchStrength');
        expect(trace).toHaveProperty('ruleScore');
        expect(trace.rule).toHaveProperty('_id');
        expect(trace.rule).toHaveProperty('title');
        expect(trace.rule).toHaveProperty('conditions');
        expect(trace.rule).toHaveProperty('action');
      });
    });
  });
});