const Domain = require('../models/Domain');
const QuestionSet = require('../models/QuestionSet');
const AssessmentGenerationService = require('../services/AssessmentGenerationService');

// @desc    Create domain with LLM-generated questions
// @route   POST /api/admin/domains
// @access  Admin
const createDomainWithQuestions = async (req, res, next) => {
  try {
    const { name, description, targetAudience = 'professionals and learners' } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Domain name and description are required'
      });
    }

    console.log(`🚀 Creating domain: ${name} with LLM-generated questions...`);

    // Step 1: Generate questions using improved AssessmentGenerationService
    const assessmentGenerator = new AssessmentGenerationService();
    
    const questionGeneration = await assessmentGenerator.generateAssessmentQuestions(
      name,
      description,
      15 // Generate 15 questions instead of 6
    );

    if (!questionGeneration.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate valid questions. Please try again.',
        error: questionGeneration.error
      });
    }

    const generatedQuestions = { questions: questionGeneration.questions };
    console.log(`✅ Generated ${generatedQuestions.questions.length} questions for ${name}`);

    // Step 2: Create QuestionSet in database
    const questionSet = new QuestionSet({
      questions: generatedQuestions.questions,
      version: '1.0.0',
      active: true
    });

    await questionSet.save();
    console.log(`📋 Created question set with ID: ${questionSet._id}`);

    // Step 3: Create Domain and link to QuestionSet
    const domain = new Domain({
      name: name.trim(),
      description: description.trim(),
      questionSetId: questionSet._id,
      active: true
    });

    await domain.save();

    // Step 4: Update QuestionSet with domain reference
    questionSet.domainId = domain._id;
    await questionSet.save();

    console.log(`✅ Successfully created domain: ${name} with ${generatedQuestions.questions.length} questions`);

    res.status(201).json({
      success: true,
      message: `Domain "${name}" created successfully with ${generatedQuestions.questions.length} AI-generated questions`,
      data: {
        domain: {
          id: domain._id,
          name: domain.name,
          description: domain.description,
          questionSetId: domain.questionSetId,
          questionsCount: generatedQuestions.questions.length,
          active: domain.active,
          createdAt: domain.createdAt
        },
        sampleQuestions: generatedQuestions.questions.slice(0, 2) // Return first 2 questions as preview
      }
    });

  } catch (error) {
    console.error('❌ Error creating domain with questions:', error);
    next(error);
  }
};

// @desc    Get all domains (admin view)
// @route   GET /api/admin/domains
// @access  Admin
const getAdminDomains = async (req, res, next) => {
  try {
    const domains = await Domain.find({})
      .populate({
        path: 'questionSetId',
        select: 'questions version active'
      })
      .sort({ createdAt: -1 });

    const domainsWithStats = domains.map(domain => ({
      id: domain._id,
      name: domain.name,
      description: domain.description,
      questionsCount: domain.questionSetId?.questions?.length || 0,
      version: domain.questionSetId?.version || '1.0.0',
      active: domain.active,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    }));

    res.json({
      success: true,
      data: {
        domains: domainsWithStats,
        totalDomains: domains.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin domains:', error);
    next(error);
  }
};

// @desc    Get domains with questions (for rules creation)
// @route   GET /api/admin/domains-with-questions
// @access  Admin
const getDomainsWithQuestions = async (req, res, next) => {
  try {
    const domains = await Domain.find({ active: true })
      .populate({
        path: 'questionSetId',
        select: 'questions version active'
      })
      .sort({ createdAt: -1 });

    const domainsWithQuestions = domains.map(domain => ({
      id: domain._id,
      _id: domain._id,
      name: domain.name,
      description: domain.description,
      questions: domain.questionSetId?.questions?.map(q => ({
        key: q.key,
        question: q.question,
        type: q.type,
        options: q.options || []
      })) || [],
      questionsCount: domain.questionSetId?.questions?.length || 0,
      version: domain.questionSetId?.version || '1.0.0',
      active: domain.active,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    }));

    res.json({
      success: true,
      data: {
        domains: domainsWithQuestions,
        totalDomains: domains.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching domains with questions:', error);
    next(error);
  }
};

// @desc    Regenerate questions for existing domain
// @route   POST /api/admin/domains/:id/regenerate-questions
// @access  Admin
const regenerateDomainQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetAudience = 'professionals and learners' } = req.body;

    const domain = await Domain.findById(id).populate('questionSetId');
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    console.log(`🔄 Regenerating questions for domain: ${domain.name}`);

    // Use the improved AssessmentGenerationService
    const AssessmentGenerationService = require('../services/AssessmentGenerationService');
    const assessmentGenerator = new AssessmentGenerationService();
    
    const questionGeneration = await assessmentGenerator.generateAssessmentQuestions(
      domain.name,
      domain.description,
      15 // Generate 15 questions
    );

    if (!questionGeneration.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate new questions. Please try again.',
        error: questionGeneration.error
      });
    }

    // Update existing QuestionSet
    domain.questionSetId.questions = questionGeneration.questions;
    domain.questionSetId.version = `${parseFloat(domain.questionSetId.version) + 0.1}`.slice(0, 5);
    domain.questionSetId.updatedAt = new Date();
    
    await domain.questionSetId.save();

    console.log(`✅ Regenerated ${questionGeneration.questions.length} questions for ${domain.name}`);

    res.json({
      success: true,
      message: `Questions regenerated successfully for "${domain.name}"`,
      data: {
        domain: {
          id: domain._id,
          name: domain.name,
          questionsCount: questionGeneration.questions.length,
          version: domain.questionSetId.version
        },
        sampleQuestions: questionGeneration.questions.slice(0, 2),
        usedFallback: questionGeneration.usedFallback || false
      }
    });

  } catch (error) {
    console.error('❌ Error regenerating questions:', error);
    next(error);
  }
};

// @desc    Delete domain and associated data
// @route   DELETE /api/admin/domains/:id
// @access  Admin
const deleteDomain = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the domain first
    const domain = await Domain.findById(id).populate('questionSetId');
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    console.log(`🗑️ Deleting domain: ${domain.name} (ID: ${id})`);

    // Check if domain is being used in any active sessions
    const Session = require('../models/Session');
    const activeSessions = await Session.find({ domainId: id, status: { $ne: 'completed' } });
    
    if (activeSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete domain "${domain.name}". It has ${activeSessions.length} active session(s). Complete or cancel those sessions first.`,
        activeSessions: activeSessions.length
      });
    }

    // Check if domain has associated rules
    const RuleV2 = require('../models/RuleV2');
    const associatedRules = await RuleV2.find({ domainId: id });
    
    if (associatedRules.length > 0) {
      console.log(`⚠️ Domain has ${associatedRules.length} associated rules. Deleting them...`);
      await RuleV2.deleteMany({ domainId: id });
    }

    // Delete associated QuestionSet
    if (domain.questionSetId) {
      await QuestionSet.findByIdAndDelete(domain.questionSetId);
      console.log(`📋 Deleted question set: ${domain.questionSetId}`);
    }

    // Delete completed sessions for this domain (optional cleanup)
    const completedSessions = await Session.find({ domainId: id, status: 'completed' });
    if (completedSessions.length > 0) {
      console.log(`🧹 Cleaning up ${completedSessions.length} completed sessions...`);
      await Session.deleteMany({ domainId: id, status: 'completed' });
    }

    // Finally delete the domain
    await Domain.findByIdAndDelete(id);

    console.log(`✅ Successfully deleted domain: ${domain.name}`);

    res.json({
      success: true,
      message: `Domain "${domain.name}" has been successfully deleted along with its ${domain.questionSetId?.questions?.length || 0} questions${associatedRules.length > 0 ? ` and ${associatedRules.length} rules` : ''}${completedSessions.length > 0 ? ` and ${completedSessions.length} completed sessions` : ''}.`,
      deletedData: {
        domainName: domain.name,
        questionsDeleted: domain.questionSetId?.questions?.length || 0,
        rulesDeleted: associatedRules.length,
        sessionsDeleted: completedSessions.length
      }
    });

  } catch (error) {
    console.error('❌ Error deleting domain:', error);
    next(error);
  }
};

module.exports = {
  createDomainWithQuestions,
  getAdminDomains,
  getDomainsWithQuestions,
  regenerateDomainQuestions,
  deleteDomain
};