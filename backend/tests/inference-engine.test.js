const { RuleEngine, FactNormalizationService } = require('../src/services/InferenceEngine');
const { Domain, Rule } = require('../src/models');
const { connectTestDB, clearTestDB, closeTestDB } = require('./test-helpers');
const mongoose = require('mongoose');

describe('Inference Engine', () => {
  let domainId;
  
  beforeAll(async () => {
    await connectTestDB();
    
    // Clear existing test data to avoid duplicates
    await clearTestDB();
    
    // Create test domain only once
    let domain = await Domain.findOne({ name: 'Web Development' });
    if (!domain) {
      domain = new Domain({
        name: 'Web Development',
        description: 'Full-stack web development career path',
        questionSetId: new mongoose.Types.ObjectId(),
        isActive: true
      });
      await domain.save();
    }
    domainId = domain._id;
    
    // Create test rules based on docs/web-dev-rules.md
    const rules = [
      {
        name: 'Complete Beginner Web Foundation',
        priority: 10,
        domainId,
        conditions: {
          experienceLevel: 'absolute_beginner',
          studyHours: '>=1'
        },
        recommendations: {
          skills: ['HTML/CSS Fundamentals', 'Basic JavaScript'],
          resources: ['MDN Web Docs', 'freeCodeCamp', 'Codecademy HTML/CSS'],
          projects: ['Personal Portfolio Website', 'Simple Landing Page'],
          timeline: '16-20 weeks'
        },
        isActive: true
      },
      {
        name: 'Frontend Developer Specialization',
        priority: 9,
        domainId,
        conditions: {
          focusArea: 'frontend',
          experienceLevel: ['beginner', 'intermediate', 'advanced']
        },
        recommendations: {
          skills: ['JavaScript ES6+', 'React.js', 'CSS Frameworks'],
          resources: ['React Documentation', 'JavaScript.info', 'CSS-Tricks'],
          projects: ['Interactive React Dashboard', 'Responsive Web Application'],
          timeline: '12-16 weeks'
        },
        isActive: true
      },
      {
        name: 'Backend Developer Specialization',
        priority: 9,
        domainId,
        conditions: {
          focusArea: 'backend',
          experienceLevel: ['beginner', 'intermediate', 'advanced']
        },
        recommendations: {
          skills: ['Node.js', 'Express.js', 'Database Design', 'REST API Development'],
          resources: ['Node.js Documentation', 'MongoDB University', 'Express.js Guide'],
          projects: ['REST API with Authentication', 'Real-time Chat Application'],
          timeline: '12-16 weeks'
        },
        isActive: true
      },
      {
        name: 'Full-Stack Developer Journey',
        priority: 8,
        domainId,
        conditions: {
          focusArea: 'fullstack',
          experienceLevel: ['beginner', 'intermediate']
        },
        recommendations: {
          skills: ['JavaScript (Frontend + Backend)', 'React.js', 'Node.js/Express', 'Database Integration'],
          resources: ['Full-Stack Open Course', 'The Odin Project', 'freeCodeCamp Full-Stack'],
          projects: ['Complete CRUD Application', 'Social Media Dashboard'],
          timeline: '16-24 weeks'
        },
        isActive: true
      },
      {
        name: 'Intensive Learning Accelerated Path',
        priority: 8,
        domainId,
        conditions: {
          commitmentLevel: 'intensive',
          studyHours: '>=30'
        },
        recommendations: {
          skills: ['Accelerated Learning Techniques', 'Industry Best Practices'],
          resources: ['Intensive Bootcamp Materials', 'Fast-Track Courses'],
          timeline: '8-12 weeks',
          warnings: ['Intensive pace requires consistent daily commitment']
        },
        isActive: true
      },
      {
        name: 'Employment-Ready Skill Stack',
        priority: 9,
        domainId,
        conditions: {
          careerGoal: 'job_switch',
          experienceLevel: ['beginner', 'intermediate']
        },
        recommendations: {
          skills: ['Portfolio Development', 'Technical Interview Preparation', 'Git/GitHub', 'Deployment Skills'],
          resources: ['Interview Prep Resources', 'Portfolio Examples', 'Technical Interview Questions'],
          projects: ['Industry-Standard Application', 'Deploy 3+ Projects'],
          timeline: '12-20 weeks'
        },
        isActive: true
      },
      {
        name: 'Freelance Developer Toolkit',
        priority: 7,
        domainId,
        conditions: {
          careerGoal: 'freelance'
        },
        recommendations: {
          skills: ['Client Communication', 'Project Management', 'Pricing Strategies'],
          resources: ['Freelance Business Guide', 'Client Management Tools', 'Contract Templates'],
          projects: ['Client Landing Page Template', 'Portfolio with Case Studies'],
          timeline: '8-16 weeks'
        },
        isActive: true
      },
      {
        name: 'Part-Time Learning Journey',
        priority: 7,
        domainId,
        conditions: {
          commitmentLevel: 'casual',
          studyHours: '<=10'
        },
        recommendations: {
          skills: ['Foundation Skills (One at a Time)', 'Bite-sized Learning'],
          resources: ['Weekend Project Ideas', 'Flexible Online Courses', 'Mobile Learning Apps'],
          timeline: '20-32 weeks',
          warnings: ['Progress will be gradual with limited study time']
        },
        isActive: true
      },
      {
        name: 'Project-Based Learning Focus',
        priority: 6,
        domainId,
        conditions: {
          learningPreferences: 'kinesthetic'
        },
        recommendations: {
          skills: ['Learn by Building', 'Practical Application'],
          resources: ['Project-Based Tutorials', 'Build-Along Courses', 'Coding Challenges'],
          projects: ['Build Multiple Small Projects', 'Progressive Skill Building']
        },
        isActive: true
      },
      {
        name: 'Advanced Developer Deep Dive',
        priority: 8,
        domainId,
        conditions: {
          experienceLevel: 'advanced',
          studyHours: '>=10'
        },
        recommendations: {
          skills: ['Architecture Patterns', 'Performance Optimization', 'Advanced Frameworks'],
          resources: ['Advanced Documentation', 'Conference Talks', 'Open Source Contribution'],
          projects: ['Scalable Architecture Project', 'Performance Optimization Case Study'],
          timeline: '8-12 weeks'
        },
        isActive: true
      },
      {
        name: 'Web Development Exploration',
        priority: 6,
        domainId,
        conditions: {
          focusArea: 'unsure'
        },
        recommendations: {
          skills: ['Try Multiple Technologies', 'Explore Different Paths'],
          resources: ['Overview of Web Technologies', 'Career Path Guides'],
          projects: ['Frontend vs Backend Comparison Project', 'Multiple Small Experiments'],
          timeline: '12-16 weeks'
        },
        isActive: true
      },
      {
        name: 'Standard Web Development Path',
        priority: 1,
        domainId,
        conditions: {},
        recommendations: {
          skills: ['HTML/CSS', 'JavaScript', 'Basic Framework'],
          resources: ['General Web Development Resources'],
          projects: ['Basic Web Application'],
          timeline: '16-20 weeks'
        },
        isActive: true
      }
    ];
    
    await Rule.insertMany(rules);
  });
  
  afterAll(async () => {
    await clearTestDB();
    await closeTestDB();
  });

  describe('FactNormalizationService', () => {
    test('should normalize basic answers correctly', () => {
      const answers = {
        education_level: 'bachelors',
        coding_experience: '2',
        weekly_hours: '15',
        web_dev_focus: 'frontend',
        career_goal: 'job_switch',
        learning_style: ['video_courses', 'hands_on']
      };
      
      const facts = FactNormalizationService.normalizeAnswers(answers);
      
      expect(facts.educationLevel).toBe('bachelors');
      expect(facts.experienceLevel).toBe('beginner');
      expect(facts.experienceYears).toBe(1.5);
      expect(facts.studyHours).toBe(15);
      expect(facts.commitmentLevel).toBe('consistent');
      expect(facts.focusArea).toBe('frontend');
      expect(facts.careerPath).toBe('frontend_specialist');
      expect(facts.careerGoal).toBe('job_switch');
      expect(facts.urgency).toBe('high');
      expect(facts.learningPreferences).toContain('visual');
      expect(facts.learningPreferences).toContain('kinesthetic');
      expect(facts.resourceTypes).toContain('video');
      expect(facts.resourceTypes).toContain('interactive');
    });
    
    test('should handle absolute beginner correctly', () => {
      const answers = {
        coding_experience: '0',
        weekly_hours: '5'
      };
      
      const facts = FactNormalizationService.normalizeAnswers(answers);
      
      expect(facts.experienceLevel).toBe('absolute_beginner');
      expect(facts.experienceYears).toBe(0);
      expect(facts.commitmentLevel).toBe('casual');
    });
    
    test('should detect inconsistencies', () => {
      const answers = {
        education_level: 'phd',
        coding_experience: '5+',
        weekly_hours: '5',
        career_goal: 'job_switch'
      };
      
      const facts = FactNormalizationService.normalizeAnswers(answers);
      
      expect(facts.flags).toContain('inconsistent_profile');
      expect(facts.flags).toContain('unrealistic_timeline');
    });
    
    test('should handle missing answers gracefully', () => {
      const answers = {};
      
      const facts = FactNormalizationService.normalizeAnswers(answers);
      
      expect(facts.educationLevel).toBe('unknown');
      expect(facts.experienceLevel).toBe('unknown');
      expect(facts.studyHours).toBe(0);
      expect(facts.focusArea).toBeUndefined();
      expect(facts.careerPath).toBe('generalist');
    });
  });

  describe('RuleEngine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new RuleEngine();
    });
    
    test('should load rules from database', async () => {
      const ruleCount = await engine.loadRules(domainId);
      
      expect(ruleCount).toBe(12);
      expect(engine.rules).toHaveLength(12);
      expect(engine.rules[0].priority).toBeGreaterThanOrEqual(engine.rules[1].priority);
    });
    
    test('should evaluate rule conditions correctly', async () => {
      await engine.loadRules(domainId);
      
      const facts = {
        experienceLevel: 'absolute_beginner',
        studyHours: 5
      };
      
      const beginnerRule = engine.rules.find(r => r.name === 'Complete Beginner Web Foundation');
      const evaluation = engine.evaluateRule(beginnerRule, facts);
      
      expect(evaluation.matches).toBe(true);
      expect(evaluation.matchDetails).toContain('experienceLevel: absolute_beginner matches absolute_beginner');
    });
    
    test('should handle array conditions (OR logic)', async () => {
      await engine.loadRules(domainId);
      
      const facts = {
        focusArea: 'frontend',
        experienceLevel: 'intermediate'
      };
      
      const frontendRule = engine.rules.find(r => r.name === 'Frontend Developer Specialization');
      const evaluation = engine.evaluateRule(frontendRule, facts);
      
      expect(evaluation.matches).toBe(true);
    });
    
    test('should handle numeric comparisons', async () => {
      await engine.loadRules(domainId);
      
      const facts = {
        commitmentLevel: 'intensive',
        studyHours: 35
      };
      
      const intensiveRule = engine.rules.find(r => r.name === 'Intensive Learning Accelerated Path');
      const evaluation = engine.evaluateRule(intensiveRule, facts);
      
      expect(evaluation.matches).toBe(true);
    });
    
    test('should handle array containment for learning preferences', async () => {
      await engine.loadRules(domainId);
      
      const facts = {
        learningPreferences: ['kinesthetic', 'visual']
      };
      
      const projectRule = engine.rules.find(r => r.name === 'Project-Based Learning Focus');
      const evaluation = engine.evaluateRule(projectRule, facts);
      
      expect(evaluation.matches).toBe(true);
    });
  });

  describe('Full Inference Integration', () => {
    let engine;
    
    beforeEach(() => {
      engine = new RuleEngine();
    });

    // Test Profile 1: Complete Beginner - Casual Learner
    test('Profile 1: Sarah the Newcomer - Complete Beginner', async () => {
      const answers = {
        education_level: 'bachelors',
        coding_experience: '0',
        weekly_hours: '5',
        web_dev_focus: 'frontend',
        career_goal: 'personal_projects',
        learning_style: ['video_courses']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.skills).toContain('HTML/CSS Fundamentals');
      expect(result.recommendation.skills).toContain('Basic JavaScript');
      expect(result.recommendation.timeline).toBe('16-20 weeks');
      expect(result.recommendation.metadata.appliedRules.some(r =>
        r.name === 'Complete Beginner Web Foundation')).toBe(true);
      expect(result.recommendation.metadata.confidence).toBeGreaterThan(0.6);
    });

    // Test Profile 2: Career Switcher - Intensive  
    test('Profile 2: Mike the Career Changer - Intensive Full-Stack', async () => {
      const answers = {
        education_level: 'masters',
        coding_experience: '1',
        weekly_hours: '40',
        web_dev_focus: 'fullstack',
        career_goal: 'job_switch',
        learning_style: ['structured_course', 'hands_on']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.skills).toContain('JavaScript (Frontend + Backend)');
      expect(result.recommendation.skills).toContain('Portfolio Development');
      expect(result.recommendation.timeline).toBe('12-20 weeks');
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Full-Stack Developer Journey')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Intensive Learning Accelerated Path')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Employment-Ready Skill Stack')).toBe(true);
    });

    // Test Profile 3: Experienced Developer - Backend Focus
    test('Profile 3: Alex the Backend Specialist', async () => {
      const answers = {
        education_level: 'bootcamp',
        coding_experience: '3',
        weekly_hours: '20',
        web_dev_focus: 'backend',
        career_goal: 'skill_upgrade',
        learning_style: ['documentation', 'hands_on']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.skills).toContain('Node.js');
      expect(result.recommendation.skills).toContain('Express.js');
      expect(result.recommendation.skills).toContain('Database Design');
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Backend Developer Specialization')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Project-Based Learning Focus')).toBe(true);
    });

    // Test Profile 4: Advanced Developer - High Commitment
    test('Profile 4: Jessica the Expert - Advanced Frontend', async () => {
      const answers = {
        education_level: 'masters',
        coding_experience: '5+',
        weekly_hours: '20',
        web_dev_focus: 'frontend',
        career_goal: 'freelance',
        learning_style: ['documentation', 'community']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.skills).toContain('Architecture Patterns');
      expect(result.recommendation.skills).toContain('Client Communication');
      expect(result.recommendation.timeline).toBe('12-16 weeks');
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Advanced Developer Deep Dive')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Frontend Developer Specialization')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Freelance Developer Toolkit')).toBe(true);
    });

    // Test Profile 5: Self-Taught Explorer
    test('Profile 5: David the Explorer - Unsure Focus', async () => {
      const answers = {
        education_level: 'self_taught',
        coding_experience: '2',
        weekly_hours: '10',
        web_dev_focus: 'unsure',
        career_goal: 'side_business',
        learning_style: ['hands_on', 'video_courses']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.skills).toContain('Try Multiple Technologies');
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Web Development Exploration')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Project-Based Learning Focus')).toBe(true);
    });

    // Test Profile 8: Inconsistent Profile (Edge Case)
    test('Profile 8: Robert the Inconsistent - Advanced but Low Hours', async () => {
      const answers = {
        education_level: 'phd',
        coding_experience: '5+',
        weekly_hours: '5',
        web_dev_focus: 'frontend',
        career_goal: 'job_switch',
        learning_style: ['documentation']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.facts.flags).toContain('inconsistent_profile');
      expect(result.facts.flags).toContain('unrealistic_timeline');
      expect(result.recommendation.warnings).toHaveLength(3);
      expect(result.recommendation.warnings.some(w => 
        w.includes('inconsistencies'))).toBe(true);
      expect(result.recommendation.metadata.confidence).toBeLessThan(0.7);
    });

    // Test Profile 11: Minimal Commitment
    test('Profile 11: Lisa the Busy Professional - Casual Beginner', async () => {
      const answers = {
        education_level: 'masters',
        coding_experience: '0',
        weekly_hours: '5',
        web_dev_focus: 'frontend',
        career_goal: 'personal_projects',
        learning_style: ['video_courses']
      };
      
      const result = await engine.infer(domainId, answers);
      
      expect(result.recommendation.timeline).toBe('16-20 weeks');
      expect(result.recommendation.warnings.some(w => 
        w.includes('gradual'))).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Complete Beginner Web Foundation')).toBe(true);
      expect(result.recommendation.metadata.appliedRules.some(r => 
        r.name === 'Part-Time Learning Journey')).toBe(true);
    });

    // Test fallback scenario
    test('should use fallback when no rules match', async () => {
      // Create an engine with no rules
      const emptyEngine = new RuleEngine();
      emptyEngine.rules = [];
      
      const answers = {
        education_level: 'bachelors',
        coding_experience: '2',
        weekly_hours: '10'
      };
      
      const facts = FactNormalizationService.normalizeAnswers(answers);
      const matchedRules = emptyEngine.processRules(facts);
      const recommendation = emptyEngine.combineRecommendations(matchedRules, facts);
      
      expect(recommendation.skills).toContain('HTML/CSS');
      expect(recommendation.skills).toContain('JavaScript Basics');
      expect(recommendation.timeline).toBe('16-20 weeks');
      expect(recommendation.metadata.confidence).toBe(0.3);
      expect(recommendation.metadata.reasoning).toContain('Using fallback recommendation - no specific rules matched');
    });
  });

  describe('Trace and Debugging', () => {
    test('should generate comprehensive trace', async () => {
      const engine = new RuleEngine();
      
      const answers = {
        education_level: 'bachelors',
        coding_experience: '1',
        weekly_hours: '15',
        web_dev_focus: 'frontend',
        career_goal: 'job_switch',
        learning_style: ['hands_on']
      };
      
      const result = await engine.infer(domainId, answers);
      const trace = result.trace;
      
      expect(trace.length).toBeGreaterThan(10);
      expect(trace[0].step).toBe('inference_start');
      expect(trace[1].step).toBe('fact_normalization');
      expect(trace[2].step).toBe('rule_loading');
      expect(trace[3].step).toBe('rule_processing_start');
      expect(trace[4].step).toBe('rule_evaluation');
      // Trace may have multiple rule_evaluation steps before completion
      const completionIndex = trace.findIndex(t => t.step === 'rule_processing_complete');
      expect(completionIndex).toBeGreaterThan(4);
      
      // Check that rule evaluations are in trace
      const ruleEvaluations = trace.filter(t => t.step === 'rule_evaluation');
      expect(ruleEvaluations.length).toBeGreaterThan(0);
      
      // Check metadata
      expect(result.metadata.rulesEvaluated).toBe(12);
      expect(result.metadata.rulesMatched).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });
  });
});