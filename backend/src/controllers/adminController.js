const { TestProfile, Domain, Session, User } = require('../models');
const RuleV2 = require('../models/RuleV2');
const { validationResult } = require('express-validator');
const { RuleEngine } = require('../services/InferenceEngine');

class AdminController {
  /**
   * Get all rules with filtering and pagination
   * GET /api/admin/rules
   */
  static async getRules(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        domain: domainId,
        status,
        priority,
        page = 1,
        limit = 20,
        search
      } = req.query;

      // Build filter query
      const filter = {};
      
      // Exclude archived rules by default
      filter.status = { $ne: 'archived' };
      
      if (domainId) filter.domainId = domainId;
      if (status) {
        if (status === 'active') filter.isActive = true;
        else if (status === 'inactive') filter.isActive = false;
        // Override default filter if status is explicitly set
        filter.status = status;
      }
      
      if (priority) {
        const priorityMap = { low: [1, 3], medium: [4, 7], high: [8, 10] };
        if (priorityMap[priority]) {
          filter.priority = { $gte: priorityMap[priority][0], $lte: priorityMap[priority][1] };
        }
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { explanation: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      // Get rules with populated domain
      const rules = await RuleV2.find(filter)
        .populate('domainId', 'name description')
        .populate('createdBy', 'name email')
        .populate('lastPublishedBy', 'name email')
        .sort({ priority: -1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalCount = await RuleV2.countDocuments(filter);

      // Format rules for admin UI
      const formattedRules = rules.map(rule => ({
        id: rule._id,
        name: rule.name,
        title: rule.title,
        domain: rule.domainId?.name,
        domainId: rule.domainId?._id,
        priority: rule.priority,
        status: rule.status,
        isActive: rule.isActive,
        currentVersion: rule.currentVersion,
        publishedVersion: rule.publishedVersion,
        totalVersions: rule.versions.length,
        conditions: AdminController.formatConditionsForUI(rule.conditions),
        actions: rule.actions,
        explanation: rule.explanation,
        metrics: {
          executions: rule.metrics?.totalExecutions || 0,
          successRate: rule.metrics?.totalExecutions > 0 
            ? ((rule.metrics.successfulMatches / rule.metrics.totalExecutions) * 100).toFixed(1) + '%'
            : 'N/A',
          avgExecutionTime: rule.metrics?.averageExecutionTime || 0
        },
        createdBy: rule.createdBy?.name,
        lastPublishedAt: rule.lastPublishedAt,
        lastPublishedBy: rule.lastPublishedBy?.name,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }));

      res.json({
        success: true,
        message: 'Rules retrieved successfully',
        data: {
          rules: formattedRules,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNext: skip + rules.length < totalCount,
            hasPrev: page > 1
          },
          filters: {
            domain: domainId,
            status,
            priority,
            search
          }
        }
      });

    } catch (error) {
      console.error('Error getting rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rules',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get single rule with version history
   * GET /api/admin/rules/:ruleId
   */
  static async getRule(req, res) {
    try {
      const { ruleId } = req.params;

      const rule = await RuleV2.findById(ruleId)
        .populate('domainId', 'name description')
        .populate('createdBy', 'name email')
        .populate('lastPublishedBy', 'name email')
        .populate('versions.createdBy', 'name email');

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found'
        });
      }

      // Get version history with details
      const versionHistory = rule.getVersionHistory().map(version => ({
        version: version.version,
        title: version.title,
        conditions: version.conditions,
        actions: version.actions,
        explanation: version.explanation,
        priority: version.priority,
        isActive: version.isActive,
        isPublished: version.isPublished,
        publishedAt: version.publishedAt,
        createdBy: version.createdBy?.name,
        createdAt: version.createdAt
      }));

      // Get recent test results
      const recentTests = rule.testResults
        .sort((a, b) => b.testedAt - a.testedAt)
        .slice(0, 5);

      res.json({
        success: true,
        message: 'Rule retrieved successfully',
        data: {
          rule: {
            id: rule._id,
            name: rule.name,
            title: rule.title,
            domain: rule.domainId?.name,
            domainId: rule.domainId?._id,
            currentVersion: rule.currentVersion,
            publishedVersion: rule.publishedVersion,
            status: rule.status,
            isActive: rule.isActive,
            matchMode: rule.matchMode,
            conditions: AdminController.formatConditionsForUI(rule.conditions),
            actions: rule.actions,
            explanation: rule.explanation,
            priority: rule.priority,
            metrics: rule.metrics,
            createdBy: rule.createdBy?.name,
            lastPublishedBy: rule.lastPublishedBy?.name,
            lastPublishedAt: rule.lastPublishedAt,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
          },
          versionHistory,
          recentTests,
          canPublish: rule.currentVersion !== rule.publishedVersion,
          canRollback: rule.publishedVersion > 1
        }
      });

    } catch (error) {
      console.error('Error getting rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Create new rule
   * POST /api/admin/rules
   */
  static async createRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        domainId,
        matchMode,
        conditions,
        actions,
        explanation,
        priority,
        isActive = false
      } = req.body;

      const userId = req.user.id;

      // Validate domain exists
      const domain = await Domain.findById(domainId);
      if (!domain) {
        return res.status(400).json({
          success: false,
          message: 'Domain not found'
        });
      }

      // Generate rule name from title
      const name = AdminController.generateRuleName(title);

      // Convert conditions to Mixed format for inference engine
      const mixedConditions = AdminController.convertConditionsToMixed(conditions);

      // Create rule with first version
      const rule = new RuleV2({
        domainId,
        name,
        title,
        matchMode,
        conditions: mixedConditions,
        actions,
        explanation,
        priority,
        isActive,
        status: isActive ? 'active' : 'draft',
        createdBy: userId
      });

      // Create first version
      rule.createVersion({
        title,
        matchMode,
        conditions,
        actions,
        explanation,
        priority,
        isActive
      }, userId);

      await rule.save();

      res.status(201).json({
        success: true,
        message: 'Rule created successfully',
        data: {
          ruleId: rule._id,
          name: rule.name,
          version: rule.currentVersion,
          status: rule.status
        }
      });

    } catch (error) {
      console.error('Error creating rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update existing rule (creates new version)
   * PUT /api/admin/rules/:ruleId
   */
  static async updateRule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { ruleId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const rule = await RuleV2.findById(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found'
        });
      }

      // Get current version data as base
      const currentVersion = rule.versions[rule.versions.length - 1];
      const newVersionData = {
        title: updateData.title || currentVersion.title,
        matchMode: updateData.matchMode || currentVersion.matchMode,
        conditions: updateData.conditions || currentVersion.conditions,
        actions: updateData.actions || currentVersion.actions,
        explanation: updateData.explanation || currentVersion.explanation,
        priority: updateData.priority !== undefined ? updateData.priority : currentVersion.priority,
        isActive: updateData.isActive !== undefined ? updateData.isActive : currentVersion.isActive
      };

      // Create new version
      rule.createVersion(newVersionData, userId);

      // Update rule name if title changed
      if (updateData.title && updateData.title !== rule.title) {
        rule.name = AdminController.generateRuleName(updateData.title);
      }

      await rule.save();

      res.json({
        success: true,
        message: 'Rule updated successfully',
        data: {
          ruleId: rule._id,
          newVersion: rule.currentVersion,
          status: rule.status,
          needsPublishing: true
        }
      });

    } catch (error) {
      console.error('Error updating rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Publish rule (activate specific version)
   * POST /api/admin/rules/:ruleId/publish
   */
  static async publishRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { version } = req.body;
      const userId = req.user.id;

      const rule = await RuleV2.findById(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found'
        });
      }

      // Use current version if not specified
      const versionToPublish = version || rule.currentVersion;

      // Publish the version
      const publishedVersion = rule.publishVersion(versionToPublish, userId);
      await rule.save();

      // Reload inference engine cache
      await AdminController.reloadInferenceEngineCache();

      res.json({
        success: true,
        message: 'Rule published successfully',
        data: {
          ruleId: rule._id,
          publishedVersion: publishedVersion.version,
          publishedAt: publishedVersion.publishedAt,
          status: rule.status,
          cacheReloaded: true
        }
      });

    } catch (error) {
      console.error('Error publishing rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Rollback to previous version
   * POST /api/admin/rules/:ruleId/rollback
   */
  static async rollbackRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { version } = req.body;
      const userId = req.user.id;

      const rule = await RuleV2.findById(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found'
        });
      }

      // Rollback to specified version
      rule.rollbackToVersion(version, userId);
      await rule.save();

      // Reload inference engine cache
      await AdminController.reloadInferenceEngineCache();

      res.json({
        success: true,
        message: 'Rule rolled back successfully',
        data: {
          ruleId: rule._id,
          rolledBackToVersion: version,
          currentStatus: rule.status,
          cacheReloaded: true
        }
      });

    } catch (error) {
      console.error('Error rolling back rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to rollback rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Test rules with custom facts
   * POST /api/admin/test-rules
   */
  static async testRules(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { domainId, facts, ruleIds, testProfileId } = req.body;
      const userId = req.user.id;

      // Initialize inference engine
      const engine = new RuleEngine();

      let testProfile = null;
      let actualFacts = facts;

      // If using saved test profile
      if (testProfileId) {
        testProfile = await TestProfile.findById(testProfileId);
        if (!testProfile) {
          return res.status(404).json({
            success: false,
            message: 'Test profile not found'
          });
        }
        
        // Run test using profile method
        const testResult = await testProfile.runTest(engine, userId);
        
        return res.json({
          success: true,
          message: 'Test completed successfully',
          data: {
            testProfile: {
              id: testProfile._id,
              name: testProfile.name,
              category: testProfile.category
            },
            ...testResult
          }
        });
      }

      // Run custom test
      const startTime = Date.now();
      const result = await engine.infer(domainId, actualFacts);
      const executionTime = Date.now() - startTime;

      // Format trace for UI
      const formattedTrace = result.trace ? result.trace.map((step, index) => ({
        step: index + 1,
        rule: step.rule || step.step,
        action: step.action || step.details,
        result: step.result || step.outcome,
        executionTime: step.executionTime || 0
      })) : [];

      // Get rule details for fired rules
      const appliedRules = result.recommendation?.metadata?.appliedRules || [];
      const ruleDetails = await AdminController.getRuleDetailsByNames(appliedRules.map(r => r.name), domainId);

      res.json({
        success: true,
        message: 'Test completed successfully',
        data: {
          testResults: {
            executionTime,
            rulesEvaluated: result.metadata.rulesEvaluated,
            rulesFired: result.metadata.rulesMatched,
            confidence: result.metadata.confidence,
            facts: actualFacts
          },
          appliedRules: appliedRules.map(rule => ({
            ...rule,
            details: ruleDetails.find(r => r.name === rule.name) || {}
          })),
          baseRecommendation: result.recommendation,
          trace: formattedTrace,
          metadata: result.metadata
        }
      });

    } catch (error) {
      console.error('Error testing rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test rules',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get saved test profiles
   * GET /api/admin/test-profiles
   */
  static async getTestProfiles(req, res) {
    try {
      const { domain, category, page = 1, limit = 20 } = req.query;
      
      const filter = { isActive: true };
      if (domain) filter.domainId = domain;
      if (category) filter.category = category;

      const skip = (page - 1) * limit;

      const profiles = await TestProfile.find(filter)
        .populate('domainId', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalCount = await TestProfile.countDocuments(filter);

      const formattedProfiles = profiles.map(profile => ({
        id: profile._id,
        name: profile.name,
        description: profile.description,
        domain: profile.domainId?.name,
        category: profile.category,
        tags: profile.tags,
        factsCount: profile.facts.size,
        expectedRulesCount: profile.expectedRules.length,
        usageCount: profile.usageCount,
        lastUsed: profile.lastUsed,
        createdBy: profile.createdBy?.name,
        createdAt: profile.createdAt
      }));

      res.json({
        success: true,
        message: 'Test profiles retrieved successfully',
        data: {
          profiles: formattedProfiles,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount
          }
        }
      });

    } catch (error) {
      console.error('Error getting test profiles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve test profiles',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Save test profile
   * POST /api/admin/test-profiles
   */
  static async saveTestProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        domainId,
        facts,
        expectedRules = []
      } = req.body;

      const userId = req.user.id;

      // Validate domain
      const domain = await Domain.findById(domainId);
      if (!domain) {
        return res.status(400).json({
          success: false,
          message: 'Domain not found'
        });
      }

      // Create test profile
      const testProfile = new TestProfile({
        name,
        description,
        domainId,
        facts: new Map(Object.entries(facts)),
        expectedRules,
        createdBy: userId
      });

      await testProfile.save();

      res.status(201).json({
        success: true,
        message: 'Test profile saved successfully',
        data: {
          profileId: testProfile._id,
          name: testProfile.name
        }
      });

    } catch (error) {
      console.error('Error saving test profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save test profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  static async getSystemStats(req, res) {
    try {
      // Get basic counts
      const [
        totalRules,
        activeRules,
        totalDomains,
        totalSessions,
        totalUsers,
        recentSessions
      ] = await Promise.all([
        RuleV2.countDocuments({}),
        RuleV2.countDocuments({ isActive: true }),
        Domain.countDocuments({ isActive: true }),
        Session.countDocuments({}),
        User.countDocuments({}),
        Session.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      // Get rule performance metrics
      const ruleMetrics = await RuleV2.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            avgExecutions: { $avg: '$metrics.totalExecutions' },
            totalExecutions: { $sum: '$metrics.totalExecutions' },
            avgExecutionTime: { $avg: '$metrics.averageExecutionTime' }
          }
        }
      ]);

      // Get domain distribution
      const domainStats = await RuleV2.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$domainId', count: { $sum: 1 } } },
        { $lookup: { from: 'domains', localField: '_id', foreignField: '_id', as: 'domain' } },
        { $unwind: '$domain' },
        { $project: { name: '$domain.name', count: 1 } }
      ]);

      res.json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: {
          stats: {
            totalUsers,
            totalSessions,
            activeDomains: totalDomains,
            activeRules,
            totalQuestions: 0, // Will be calculated from domains
            recentSessions,
            completionRate: 85 // Default value, can be calculated from sessions
          },
          overview: {
            totalRules,
            activeRules,
            inactiveRules: totalRules - activeRules,
            totalDomains,
            totalSessions,
            totalUsers,
            recentSessions
          },
          performance: {
            totalRuleExecutions: ruleMetrics[0]?.totalExecutions || 0,
            avgExecutionsPerRule: Math.round(ruleMetrics[0]?.avgExecutions || 0),
            avgExecutionTime: Math.round(ruleMetrics[0]?.avgExecutionTime || 0)
          },
          domainDistribution: domainStats,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Reload inference engine cache
   * POST /api/admin/reload-cache
   */
  static async reloadInferenceCache(req, res) {
    try {
      await AdminController.reloadInferenceEngineCache();

      res.json({
        success: true,
        message: 'Inference engine cache reloaded successfully',
        data: {
          reloadedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error reloading cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reload inference engine cache',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get rule validation schema for frontend form building
   * GET /api/admin/rule-schema
   */
  static async getRuleSchema(req, res) {
    try {
      const schema = {
        factKeys: [
          'educationLevel',
          'experienceLevel',
          'experienceYears',
          'studyHours',
          'commitmentLevel',
          'focusArea',
          'careerPath',
          'careerGoal',
          'urgency',
          'learningPreferences',
          'resourceTypes'
        ],
        operators: [
          { value: 'equals', label: 'Equals', types: ['string', 'number'] },
          { value: 'not_equals', label: 'Not Equals', types: ['string', 'number'] },
          { value: 'in', label: 'Is One Of', types: ['array'] },
          { value: 'not_in', label: 'Is Not One Of', types: ['array'] },
          { value: 'greater_than', label: 'Greater Than', types: ['number'] },
          { value: 'less_than', label: 'Less Than', types: ['number'] },
          { value: 'contains', label: 'Contains', types: ['string', 'array'] }
        ],
        actionTypes: [
          { value: 'recommendSkill', label: 'Recommend Skill', valueType: 'string' },
          { value: 'recommendResource', label: 'Recommend Resource', valueType: 'string' },
          { value: 'recommendProject', label: 'Recommend Project', valueType: 'string' },
          { value: 'addScore', label: 'Add Score', valueType: 'number' },
          { value: 'addWarning', label: 'Add Warning', valueType: 'string' }
        ],
        priorities: [
          { value: 1, label: '1 - Lowest' },
          { value: 5, label: '5 - Medium' },
          { value: 10, label: '10 - Highest' }
        ],
        matchModes: [
          { value: 'all', label: 'All conditions must match (AND)' },
          { value: 'any', label: 'Any condition can match (OR)' }
        ]
      };

      res.json({
        success: true,
        message: 'Rule schema retrieved successfully',
        data: schema
      });

    } catch (error) {
      console.error('Error getting rule schema:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve rule schema',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get available fact keys for domain
   * GET /api/admin/domains/:domainId/fact-keys
   */
  static async getDomainFactKeys(req, res) {
    try {
      const { domainId } = req.params;

      const domain = await Domain.findById(domainId);
      if (!domain) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found'
        });
      }

      // Get unique fact keys used in existing rules for this domain
      const existingFactKeys = await RuleV2.aggregate([
        { $match: { domainId: mongoose.Types.ObjectId(domainId), isActive: true } },
        { $unwind: '$versions' },
        { $unwind: '$versions.conditions' },
        { $group: { _id: '$versions.conditions.factKey' } },
        { $project: { factKey: '$_id', _id: 0 } }
      ]);

      // Combine with standard fact keys
      const standardFactKeys = [
        'educationLevel', 'experienceLevel', 'experienceYears',
        'studyHours', 'commitmentLevel', 'focusArea', 'careerPath',
        'careerGoal', 'urgency', 'learningPreferences', 'resourceTypes'
      ];

      const allFactKeys = [
        ...standardFactKeys,
        ...existingFactKeys.map(item => item.factKey)
      ];

      const uniqueFactKeys = [...new Set(allFactKeys)].sort();

      res.json({
        success: true,
        message: 'Domain fact keys retrieved successfully',
        data: {
          domain: domain.name,
          factKeys: uniqueFactKeys,
          standardKeys: standardFactKeys,
          domainSpecificKeys: existingFactKeys.map(item => item.factKey)
        }
      });

    } catch (error) {
      console.error('Error getting domain fact keys:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve domain fact keys',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper methods
  static generateRuleName(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  static convertConditionsToMixed(conditions) {
    const mixed = {};
    conditions.forEach(condition => {
      mixed[condition.factKey] = condition.value;
    });
    return mixed;
  }

  static formatConditionsForUI(mixedConditions) {
    if (!mixedConditions || typeof mixedConditions !== 'object') {
      return [];
    }

    return Object.entries(mixedConditions).map(([factKey, value]) => ({
      factKey,
      operator: Array.isArray(value) ? 'in' : 'equals',
      value,
      description: `${factKey} ${Array.isArray(value) ? 'is one of' : 'equals'} ${Array.isArray(value) ? value.join(', ') : value}`
    }));
  }

  static async getRuleDetailsByNames(ruleNames, domainId) {
    return await RuleV2.find({
      name: { $in: ruleNames },
      domainId: domainId,
      isActive: true
    }).select('name title explanation priority conditions actions');
  }

  static async reloadInferenceEngineCache() {
    // In production, this would clear Redis cache or reload rule cache
    // For now, we'll just simulate the reload
    console.log('🔄 Inference engine cache reloaded');
    return true;
  }

  static async deleteRule(req, res) {
    try {
      const { ruleId } = req.params;
      const userId = req.user.id;

      const rule = await RuleV2.findById(ruleId);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found'
        });
      }

      // Soft delete - mark as archived instead of actually deleting
      rule.status = 'archived';
      rule.isActive = false;
      rule.updatedBy = userId;

      await rule.save();

      // Reload cache
      await AdminController.reloadInferenceEngineCache();

      res.json({
        success: true,
        message: 'Rule archived successfully',
        data: {
          ruleId: rule._id,
          status: rule.status
        }
      });

    } catch (error) {
      console.error('Error deleting rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete rule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * User Management Methods
   */

  /**
   * Get all users with pagination and filtering
   * GET /api/admin/users
   */
  static async getUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 10,
        role,
        search
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (role) filter.role = role;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalCount = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limit);

      // Fetch users
      const users = await User.find(filter)
        .select('-passwordHash') // Exclude password hash
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get single user by ID
   * GET /api/admin/users/:userId
   */
  static async getUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.params;

      const user = await User.findById(userId).select('-passwordHash');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's session count
      const sessionCount = await Session.countDocuments({ userId: user._id });

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: {
            ...user.toObject(),
            sessionCount
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update user
   * PUT /api/admin/users/:userId
   */
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const updates = req.body;

      // Don't allow password updates through this endpoint
      delete updates.passwordHash;
      delete updates.password;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-passwordHash');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete user (soft delete or hard delete)
   * DELETE /api/admin/users/:userId
   */
  static async deleteUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.params;

      // Don't allow deleting the current admin user
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hard delete the user
      await User.findByIdAndDelete(userId);

      // Also delete user's sessions
      await Session.deleteMany({ userId });

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: {
          deletedUserId: userId,
          deletedUserEmail: user.email
        }
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AdminController;
