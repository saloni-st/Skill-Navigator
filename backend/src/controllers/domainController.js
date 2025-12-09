const Domain = require('../models/Domain');
const QuestionSet = require('../models/QuestionSet');
const RuleV2 = require('../models/RuleV2');
const { auditMiddleware } = require('../middleware/auth');

// @desc    Get all available domains
// @route   GET /api/domains
// @access  Private
const getDomains = async (req, res, next) => {
  try {
    const domains = await Domain.find({ active: true })
      .populate('questionSetId', 'questions version')
      .sort({ createdAt: 1 });

    // Add metadata for each domain
    const domainsWithMetadata = await Promise.all(
      domains.map(async (domain) => {
        const ruleCount = await RuleV2.countDocuments({ 
          domainId: domain._id,
          isActive: true 
        });
        
        return {
          id: domain._id,
          name: domain.name,
          description: domain.description,
          questionCount: domain.questionSetId?.questions?.length || 0,
          ruleCount,
          version: domain.questionSetId?.version || '1.0.0',
          createdAt: domain.createdAt,
          active: domain.active
        };
      })
    );

    res.json({
      success: true,
      count: domainsWithMetadata.length,
      message: 'Domains retrieved successfully',
      data: {
        domains: domainsWithMetadata
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get domain by ID with question set
// @route   GET /api/domains/:id
// @access  Private
const getDomainById = async (req, res, next) => {
  try {
    // Validate ObjectId
    const { id } = req.params;
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain ID format'
      });
    }

    const domain = await Domain.findById(id)
      .populate({
        path: 'questionSetId',
        select: 'questions version active',
        match: { active: true }
      });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    if (!domain.questionSetId) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found for this domain'
      });
    }

    res.json({
      success: true,
      data: {
        domain: {
          id: domain._id,
          name: domain.name,
          description: domain.description,
          questionSet: {
            id: domain.questionSetId._id,
            version: domain.questionSetId.version,
            questions: domain.questionSetId.questions.sort((a, b) => a.order - b.order),
            totalQuestions: domain.questionSetId.questions.length
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get domain question set only
// @route   GET /api/domains/:id/questions
// @access  Private
const getDomainQuestions = async (req, res, next) => {
  try {
    // Validate ObjectId
    const { id } = req.params;
    if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain ID format'
      });
    }

    const domain = await Domain.findById(id)
      .populate({
        path: 'questionSetId',
        select: 'questions version active',
        match: { active: true }
      });

    if (!domain || !domain.questionSetId) {
      return res.status(404).json({
        success: false,
        message: 'Domain or question set not found'
      });
    }

    const questions = domain.questionSetId.questions
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((q, index) => ({
        questionId: q.questionId || q.key || `question_${index}`,
        question: q.question || q.text || '', // Add question field
        text: q.question || q.text || '',
        type: q.type,
        key: q.key,
        options: q.options || [],
        required: q.required !== false,
        order: q.order || index + 1
      }));

    res.json({
      success: true,
      data: {
        domainId: domain._id,
        domainName: domain.name,
        questionSetId: domain.questionSetId._id,
        version: domain.questionSetId.version,
        questions: questions,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rules for a specific domain (Admin only)
// @route   GET /api/domains/:id/rules  
// @access  Admin
const getDomainRules = async (req, res, next) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const { status, active, page = 1, limit = 20, search } = req.query;
    
    // Build filter
    const filter = { domainId: domain._id };
    if (status) filter.status = status;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const rules = await RuleV2.find(filter)
      .populate('createdBy', 'name')
      .sort({ priority: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RuleV2.countDocuments(filter);

    const formattedRules = rules.map(rule => ({
      id: rule._id,
      name: rule.name,
      title: rule.title,
      status: rule.status,
      isActive: rule.isActive,
      priority: rule.priority,
      currentVersion: rule.currentVersion,
      publishedVersion: rule.publishedVersion,
      conditionsCount: Object.keys(rule.conditions || {}).length,
      actionsCount: rule.actions?.length || 0,
      explanation: rule.explanation,
      createdBy: rule.createdBy?.name,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      lastPublishedAt: rule.lastPublishedAt
    }));

    res.json({
      success: true,
      message: 'Domain rules retrieved successfully',
      data: {
        domain: {
          id: domain._id,
          name: domain.name
        },
        rules: formattedRules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRules: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get domain statistics (Admin only)
// @route   GET /api/domains/:id/stats
// @access  Admin  
const getDomainStats = async (req, res, next) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    // Get comprehensive statistics
    const [ruleStats, performanceStats] = await Promise.all([
      // Rule statistics
      RuleV2.aggregate([
        { $match: { domainId: domain._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgPriority: { $avg: '$priority' }
          }
        }
      ]),
      
      // Performance statistics
      RuleV2.aggregate([
        { $match: { domainId: domain._id } },
        {
          $group: {
            _id: null,
            totalExecutions: { $sum: '$metrics.totalExecutions' },
            totalSuccessfulMatches: { $sum: '$metrics.successfulMatches' },
            avgExecutionTime: { $avg: '$metrics.averageExecutionTime' }
          }
        }
      ])
    ]);

    const ruleStatsObj = ruleStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgPriority: Math.round(stat.avgPriority * 10) / 10
      };
      return acc;
    }, {});

    const performance = performanceStats[0] || {};

    res.json({
      success: true,
      message: 'Domain statistics retrieved successfully',
      data: {
        domain: {
          id: domain._id,
          name: domain.name,
          description: domain.description
        },
        statistics: {
          rules: {
            total: ruleStats.reduce((sum, stat) => sum + stat.count, 0),
            byStatus: ruleStatsObj
          },
          performance: {
            totalExecutions: performance.totalExecutions || 0,
            successfulMatches: performance.totalSuccessfulMatches || 0,
            successRate: performance.totalExecutions > 0 
              ? Math.round((performance.totalSuccessfulMatches / performance.totalExecutions) * 100)
              : 0,
            avgExecutionTime: Math.round((performance.avgExecutionTime || 0) * 100) / 100
          }
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDomains,
  getDomainById,
  getDomainQuestions,
  getDomainRules,
  getDomainStats,
};