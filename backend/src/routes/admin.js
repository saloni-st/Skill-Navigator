const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

const router = express.Router();

/**
 * All routes require authentication and admin privileges
 */
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Rules Management
 */

/**
 * Get all rules with filtering
 * GET /api/admin/rules?domain=:domainId&status=active&priority=high&page=1&limit=20
 */
router.get('/rules', [
  query('domain').optional().isMongoId().withMessage('Invalid domain ID'),
  query('status').optional().isIn(['active', 'inactive', 'draft']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority range'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
], AdminController.getRules);

/**
 * Get single rule with version history
 * GET /api/admin/rules/:ruleId
 */
router.get('/rules/:ruleId', [
  param('ruleId').isMongoId().withMessage('Invalid rule ID')
], AdminController.getRule);

/**
 * Create new rule
 * POST /api/admin/rules
 */
router.post('/rules', [
  body('title').isString().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('domainId').isMongoId().withMessage('Invalid domain ID'),
  body('matchMode').isIn(['all', 'any']).withMessage('Match mode must be "all" or "any"'),
  body('conditions').isArray({ min: 1 }).withMessage('At least one condition required'),
  body('conditions.*.factKey').isString().withMessage('Fact key is required'),
  body('conditions.*.operator').isIn(['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains']).withMessage('Invalid operator'),
  body('conditions.*.value').exists().withMessage('Value is required'),
  body('actions').isArray({ min: 1 }).withMessage('At least one action required'),
  body('actions.*.type').isIn(['recommendSkill', 'recommendResource', 'recommendProject', 'addScore', 'addWarning']).withMessage('Invalid action type'),
  body('actions.*.value').exists().withMessage('Action value is required'),
  body('explanation').isString().trim().isLength({ min: 10, max: 500 }).withMessage('Explanation must be 10-500 characters'),
  body('priority').isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10'),
  body('isActive').optional().isBoolean().withMessage('Active must be boolean')
], AdminController.createRule);

/**
 * Update existing rule (creates new version)
 * PUT /api/admin/rules/:ruleId
 */
router.put('/rules/:ruleId', [
  param('ruleId').isMongoId().withMessage('Invalid rule ID'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('matchMode').optional().isIn(['all', 'any']).withMessage('Match mode must be "all" or "any"'),
  body('conditions').optional().isArray({ min: 1 }).withMessage('At least one condition required'),
  body('actions').optional().isArray({ min: 1 }).withMessage('At least one action required'),
  body('explanation').optional().isString().trim().isLength({ min: 10, max: 500 }).withMessage('Explanation must be 10-500 characters'),
  body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Priority must be 1-10'),
  body('isActive').optional().isBoolean().withMessage('Active must be boolean')
], AdminController.updateRule);

/**
 * Publish rule (activate specific version)
 * POST /api/admin/rules/:ruleId/publish
 */
router.post('/rules/:ruleId/publish', [
  param('ruleId').isMongoId().withMessage('Invalid rule ID'),
  body('version').optional().isInt({ min: 1 }).withMessage('Invalid version number')
], AdminController.publishRule);

/**
 * Rollback to previous version
 * POST /api/admin/rules/:ruleId/rollback
 */
router.post('/rules/:ruleId/rollback', [
  param('ruleId').isMongoId().withMessage('Invalid rule ID'),
  body('version').isInt({ min: 1 }).withMessage('Version number required')
], AdminController.rollbackRule);

/**
 * Delete rule (soft delete)
 * DELETE /api/admin/rules/:ruleId
 */
router.delete('/rules/:ruleId', [
  param('ruleId').isMongoId().withMessage('Invalid rule ID')
], AdminController.deleteRule);

/**
 * Test Console
 */

/**
 * Get saved test profiles
 * GET /api/admin/test-profiles
 */
router.get('/test-profiles', AdminController.getTestProfiles);

/**
 * Save test profile
 * POST /api/admin/test-profiles
 */
router.post('/test-profiles', [
  body('name').isString().trim().isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters'),
  body('description').optional().isString().trim().isLength({ max: 200 }).withMessage('Description max 200 characters'),
  body('domainId').isMongoId().withMessage('Invalid domain ID'),
  body('facts').isObject().withMessage('Facts object required'),
  body('expectedRules').optional().isArray().withMessage('Expected rules must be array')
], AdminController.saveTestProfile);

/**
 * Run rule test with custom facts
 * POST /api/admin/test-rules
 */
router.post('/test-rules', [
  body('domainId').isMongoId().withMessage('Invalid domain ID'),
  body('facts').isObject().withMessage('Facts object required'),
  body('ruleIds').optional().isArray().withMessage('Rule IDs must be array'),
  body('testProfileId').optional().isMongoId().withMessage('Invalid test profile ID')
], AdminController.testRules);

/**
 * User Management
 */

/**
 * Get all users with pagination
 * GET /api/admin/users?page=1&limit=10&role=user&search=email
 */
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  query('search').optional().isString().trim().withMessage('Search must be string')
], AdminController.getUsers);

/**
 * Get single user by ID
 * GET /api/admin/users/:userId
 */
router.get('/users/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], AdminController.getUser);

/**
 * Update user
 * PUT /api/admin/users/:userId
 */
router.put('/users/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().isString().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('profile').optional().isObject().withMessage('Profile must be object')
], AdminController.updateUser);

/**
 * Delete user
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], AdminController.deleteUser);

/**
 * System Management
 */

/**
 * Get system stats
 * GET /api/admin/stats
 */
router.get('/stats', AdminController.getSystemStats);

/**
 * Reload inference engine cache
 * POST /api/admin/reload-cache
 */
router.post('/reload-cache', AdminController.reloadInferenceCache);

/**
 * Get rule validation schema
 * GET /api/admin/rule-schema
 */
router.get('/rule-schema', AdminController.getRuleSchema);

/**
 * Get available fact keys for domain
 * GET /api/admin/domains/:domainId/fact-keys
 */
router.get('/domains/:domainId/fact-keys', [
  param('domainId').isMongoId().withMessage('Invalid domain ID')
], AdminController.getDomainFactKeys);

/**
 * DOMAIN MANAGEMENT WITH AUTO-GENERATED QUESTIONS
 */
const Domain = require('../models/Domain');
const QuestionSet = require('../models/QuestionSet');
const AssessmentGenerationService = require('../services/AssessmentGenerationService');

const assessmentGenerator = new AssessmentGenerationService();

// GET /api/admin/assessment-config - Get current assessment configuration
router.get('/assessment-config', async (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                defaultQuestionCount: assessmentGenerator.defaultQuestionCount,
                minQuestionCount: assessmentGenerator.minQuestionCount,
                maxQuestionCount: assessmentGenerator.maxQuestionCount,
                currentModel: assessmentGenerator.model,
                maxTokens: assessmentGenerator.maxTokens,
                temperature: assessmentGenerator.temperature
            }
        });
    } catch (error) {
        console.error('Error fetching assessment config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/domains - Get all domains
router.get('/domains', async (req, res) => {
    try {
        const domains = await Domain.find().populate('questionSetId');
        res.json({
            success: true,
            domains: domains.map(domain => ({
                ...domain.toObject(),
                questionCount: domain.questionSetId?.questions?.length || 0
            }))
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/admin/domains-with-questions - Get domains with full question details for rules
const { getDomainsWithQuestions } = require('../controllers/adminDomainController');
router.get('/domains-with-questions', getDomainsWithQuestions);

// POST /api/admin/domains - Create new domain with auto-generated questions
router.post('/domains', async (req, res) => {
    try {
        const { name, description, questionCount } = req.body;
        
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                error: 'Domain name and description are required'
            });
        }

        // Check if domain already exists
        const existingDomain = await Domain.findOne({ name });
        if (existingDomain) {
            return res.status(400).json({
                success: false,
                error: 'Domain with this name already exists'
            });
        }

        const targetCount = questionCount || assessmentGenerator.defaultQuestionCount;
        console.log(`🚀 Creating new domain: ${name} with ${targetCount} questions`);

        // Generate assessment questions using LLM
        const questionGeneration = await assessmentGenerator.generateAssessmentQuestions(
            name, 
            description, 
            questionCount // Let service handle default
        );

        if (!questionGeneration.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate assessment questions',
                details: questionGeneration.error
            });
        }

        // Create question set
        const questionSet = new QuestionSet({
            questions: questionGeneration.questions,
            version: '1.0.0',
            active: true
        });

        await questionSet.save();

        // Create domain
        const domain = new Domain({
            name,
            description,
            questionSetId: questionSet._id,
            active: true
        });

        await domain.save();

        // Update question set with domain reference
        questionSet.domainId = domain._id;
        await questionSet.save();

        console.log(`✅ Successfully created domain: ${name} with ${questionGeneration.questions.length} questions`);

        res.status(201).json({
            success: true,
            domain: {
                ...domain.toObject(),
                questionCount: questionGeneration.questions.length
            },
            generation: {
                requestedCount: questionGeneration.requestedCount,
                adjustedCount: questionGeneration.adjustedCount,
                actualCount: questionGeneration.questions.length
            },
            message: `Domain "${name}" created successfully with ${questionGeneration.questions.length} assessment questions`
        });

    } catch (error) {
        console.error('Error creating domain:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/domains/:id/enhance-questions - Enhance existing domain questions
router.put('/domains/:id/enhance-questions', async (req, res) => {
    try {
        const { id } = req.params;
        const { targetQuestionCount = 15 } = req.body;

        const domain = await Domain.findById(id).populate('questionSetId');
        if (!domain) {
            return res.status(404).json({ success: false, error: 'Domain not found' });
        }

        const currentQuestions = domain.questionSetId?.questions || [];
        console.log(`🔄 Enhancing questions for ${domain.name}: ${currentQuestions.length} → ${targetQuestionCount}`);

        const enhancedQuestions = await assessmentGenerator.enhanceExistingQuestions(
            currentQuestions,
            domain.name,
            domain.description,
            targetQuestionCount
        );

        // Update question set
        domain.questionSetId.questions = enhancedQuestions;
        await domain.questionSetId.save();

        res.json({
            success: true,
            domain: {
                ...domain.toObject(),
                questionCount: enhancedQuestions.length
            },
            message: `Domain "${domain.name}" enhanced to ${enhancedQuestions.length} questions`
        });

    } catch (error) {
        console.error('Error enhancing domain questions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/domains/bulk-enhance - Enhance all domains to have sufficient questions
router.post('/domains/bulk-enhance', async (req, res) => {
    try {
        const { targetQuestionCount = 15 } = req.body;
        
        const domains = await Domain.find({ active: true }).populate('questionSetId');
        const results = [];

        for (const domain of domains) {
            try {
                const currentQuestions = domain.questionSetId?.questions || [];
                
                if (currentQuestions.length < targetQuestionCount) {
                    console.log(`🔄 Enhancing ${domain.name}: ${currentQuestions.length} → ${targetQuestionCount}`);
                    
                    const enhancedQuestions = await assessmentGenerator.enhanceExistingQuestions(
                        currentQuestions,
                        domain.name,
                        domain.description,
                        targetQuestionCount
                    );

                    domain.questionSetId.questions = enhancedQuestions;
                    await domain.questionSetId.save();

                    results.push({
                        domain: domain.name,
                        success: true,
                        previousCount: currentQuestions.length,
                        newCount: enhancedQuestions.length
                    });
                } else {
                    results.push({
                        domain: domain.name,
                        success: true,
                        message: 'Already has sufficient questions',
                        questionCount: currentQuestions.length
                    });
                }
            } catch (error) {
                results.push({
                    domain: domain.name,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            results,
            message: `Bulk enhancement completed for ${domains.length} domains`
        });

    } catch (error) {
        console.error('Error in bulk enhancement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;