require('dotenv').config();
const WebSearchService = require("./WebSearchService");

class LLMPlanningService {
    constructor() {
        this.webSearch = new WebSearchService();
        this.apiKey = process.env.GROQ_API_KEY;
        this.model = process.env.GROQ_MODEL || "deepseek-r1-distill-llama-70b";
        this.maxTokens = parseInt(process.env.GROQ_MAX_TOKENS) || 8000;
        this.temperature = parseFloat(process.env.GROQ_TEMPERATURE) || 0.7;
    }

    async generateLearningPathFromAnswers(userAnswers, sessionData) {
        console.log("🎯 Generating learning path based on user answers...");
        
        try {
            // Get user profile if available
            const UserProfile = require('../models/UserProfile');
            let userProfile = null;
            
            if (sessionData?.userId) {
                userProfile = await UserProfile.findOne({ userId: sessionData.userId });
                console.log(`👤 User profile ${userProfile ? 'found' : 'not found'} for user: ${sessionData.userId}`);
            }

            const profile = this.extractUserProfile(userAnswers, sessionData, userProfile);
            const prompt = this.buildAnswerBasedPrompt(profile, userAnswers);
            const llmResponse = await this.callLLMAPI(prompt);
            
            // DEBUG: Log the raw LLM response
            console.log("🔍 Raw LLM Response (first 500 chars):", llmResponse.substring(0, 500));
            console.log("🔍 Raw LLM Response type:", typeof llmResponse);
            
            const structuredPlan = await this.parseAndEnhanceLearningPlan(llmResponse, profile);
            
            // DEBUG: Log the structured plan
            console.log("📊 Structured Plan Keys:", Object.keys(structuredPlan));
            console.log("📊 Weekly Plan exists:", !!structuredPlan.weeklyPlan);
            console.log("📊 Assessment exists:", !!structuredPlan.assessment);
            
            const enhancedPlan = await this.enhanceWithRealWebSearch(structuredPlan, profile);
            
            // DEBUG: Log the enhanced plan
            console.log("🌟 Enhanced Plan Keys:", Object.keys(enhancedPlan));
            
            return {
                success: true,
                learningPath: enhancedPlan,
                userProfile: profile,
                generatedAt: new Date().toISOString(),
                source: "groq_llm_with_profile_and_answers"
            };
        } catch (error) {
            console.error("❌ Failed to generate learning path from answers:", error);
            return this.generateFallbackLearningPath(userAnswers, sessionData, userProfile);
        }
    }
    
    extractUserProfile(userAnswers, sessionData, userProfile = null) {
        const domain = sessionData?.domain?.name || "General";
        
        console.log("🔍 Extracting user profile for LLM...");
        console.log("📋 User answers:", userAnswers);
        console.log("📊 User profile exists:", !!userProfile);
        
        // Start with basic profile from user database
        let profile = {
            domain: domain,
            answers: userAnswers,
            hasCompleteProfile: false,
            profileCompletion: 0
        };

        // If we have a complete user profile, use it
        if (userProfile && userProfile.getLLMProfile) {
            try {
                const llmProfile = userProfile.getLLMProfile();
                console.log("✅ LLM Profile extracted:", Object.keys(llmProfile));
                
                profile = {
                    ...profile,
                    hasCompleteProfile: true,
                    profileCompletion: userProfile.currentStatus?.profileCompletionPercentage || 0,
                    
                    // Basic info
                    name: llmProfile.basicInfo?.fullName || "Unknown",
                    age: llmProfile.basicInfo?.age || null,
                    location: llmProfile.basicInfo?.location || "Unknown",
                    
                    // Education - Enhanced mapping
                    education: this.mapEducationLevel(llmProfile.education?.degree || llmProfile.education?.highestDegree),
                    fieldOfStudy: llmProfile.education?.field || llmProfile.education?.fieldOfStudy || "Unknown",
                    graduationYear: llmProfile.education?.year || llmProfile.education?.graduationYear || null,
                    institution: llmProfile.education?.institution || "Unknown",
                    certifications: llmProfile.education?.certifications || [],
                    currentlyStudying: llmProfile.education?.currentlyStudying || false,
                    
                    // Experience - Enhanced mapping
                    totalExperience: llmProfile.experience?.years || llmProfile.experience?.totalYears || 0,
                    currentRole: llmProfile.experience?.role || llmProfile.experience?.currentRole || "Student/Fresher",
                    industry: llmProfile.experience?.industry || "Unknown",
                    workType: llmProfile.experience?.workType || "student",
                    companySize: llmProfile.experience?.companySize || "unknown",
                    
                    // Technical skills - Enhanced mapping
                    programmingLanguages: this.normalizeSkillsArray(llmProfile.technicalSkills?.languages || llmProfile.technicalSkills?.programmingLanguages),
                    frameworks: this.normalizeSkillsArray(llmProfile.technicalSkills?.frameworks),
                    tools: this.normalizeSkillsArray(llmProfile.technicalSkills?.tools),
                    databases: this.normalizeSkillsArray(llmProfile.technicalSkills?.databases),
                    cloudPlatforms: this.normalizeSkillsArray(llmProfile.technicalSkills?.cloud || llmProfile.technicalSkills?.cloudPlatforms),
                    
                    // Learning preferences - Enhanced mapping
                    learningStyle: llmProfile.learningProfile?.style || llmProfile.learningPreferences?.style || "Mixed learning approach",
                    weeklyTimeCommitment: llmProfile.learningProfile?.timeCommitment || llmProfile.learningPreferences?.timeCommitment || "5-10 hours per week",
                    preferredSchedule: llmProfile.learningProfile?.schedule || llmProfile.learningPreferences?.schedule || "flexible",
                    resourceTypes: this.normalizeSkillsArray(llmProfile.learningProfile?.resourceTypes || llmProfile.learningPreferences?.resourceTypes),
                    difficultyPreference: llmProfile.learningProfile?.difficulty || llmProfile.learningPreferences?.difficulty || "progressive",
                    
                    // Career goals - Enhanced mapping
                    shortTermGoals: this.normalizeSkillsArray(llmProfile.goals?.shortTerm || llmProfile.careerGoals?.shortTerm),
                    longTermGoals: this.normalizeSkillsArray(llmProfile.goals?.longTerm || llmProfile.careerGoals?.longTerm),
                    targetRoles: this.normalizeSkillsArray(llmProfile.goals?.targetRoles || llmProfile.careerGoals?.targetRoles),
                    targetIndustries: this.normalizeSkillsArray(llmProfile.goals?.industries || llmProfile.careerGoals?.industries),
                    workLocationPreference: llmProfile.goals?.workStyle || llmProfile.careerGoals?.workStyle || "flexible",
                    careerGoals: llmProfile.careerGoals?.primary || "General skill development",
                    
                    // Interests and motivations - Enhanced mapping
                    primaryInterests: this.normalizeSkillsArray(llmProfile.interests?.primary || llmProfile.interests?.areas),
                    motivations: this.normalizeSkillsArray(llmProfile.interests?.motivations),
                    challengeAreas: this.normalizeSkillsArray(llmProfile.interests?.challenges),
                    
                    // Additional context
                    urgency: llmProfile.preferences?.urgency || "medium",
                    budgetConstraints: llmProfile.preferences?.budget || "flexible"
                };
                
                console.log(`✅ Using complete user profile (${profile.profileCompletion}% complete)`);
                console.log("🎯 Profile summary:", {
                    hasBasicInfo: !!(profile.name && profile.age),
                    hasEducation: !!(profile.education && profile.fieldOfStudy),
                    hasExperience: !!(profile.currentRole && profile.totalExperience !== undefined),
                    hasSkills: !!(profile.programmingLanguages && profile.programmingLanguages.length > 0),
                    hasGoals: !!(profile.careerGoals || profile.shortTermGoals),
                    hasInterests: !!(profile.primaryInterests && profile.primaryInterests.length > 0)
                });
            } catch (error) {
                console.error("❌ Error extracting LLM profile:", error);
                profile.hasCompleteProfile = false;
            }
        } else {
            console.log(`⚠️ No user profile found or getLLMProfile method missing, using basic answers only`);
            
            // Fallback to basic profile extraction from answers and session
            profile = {
                ...profile,
                name: "User",
                education: "unknown",
                experience: "Complete Beginner",
                timeCommitment: "5-10 hours per week", 
                careerGoals: "General skill development",
                learningStyle: "Mixed learning approach",
                currentSkills: [],
                interests: [],
                urgency: "medium"
            };
        }

        // Extract domain-specific answers dynamically with enhanced mapping
        if (domain.toLowerCase().includes('machine learning') || domain.toLowerCase().includes('ml')) {
            profile = {
                ...profile,
                experienceLevel: this.mapExperienceLevel(userAnswers.ml_experience_level || userAnswers.experience_level),
                specialization: this.mapSpecialization(userAnswers.ml_specialization_interest),
                toolsFamiliarity: this.mapToolsFamiliarity(userAnswers.ml_tools_familiarity),
                learningPreference: this.mapLearningPreference(userAnswers.learning_resource_preference),
                primaryGoal: this.mapPrimaryGoal(userAnswers.ml_goal),
                evaluationFocus: this.mapEvaluationMetric(userAnswers.ml_evaluation_metric),
                domainSpecific: {
                    hasMLExperience: userAnswers.ml_experience_level !== 'beginner',
                    preferredFramework: userAnswers.ml_tools_familiarity,
                    focusArea: userAnswers.ml_specialization_interest,
                    learningApproach: userAnswers.learning_resource_preference,
                    successMetric: userAnswers.ml_evaluation_metric
                }
            };
        } else if (domain.toLowerCase().includes('web development') || domain.toLowerCase().includes('frontend') || domain.toLowerCase().includes('backend')) {
            profile = {
                ...profile,
                experienceLevel: this.mapExperienceLevel(userAnswers.coding_experience || userAnswers.experience_level),
                specialization: userAnswers.specialization_area || "full_stack",
                frameworkPreference: userAnswers.framework_preference || "react",
                learningPreference: this.mapLearningPreference(userAnswers.learning_style || userAnswers.learning_preference),
                primaryGoal: this.mapPrimaryGoal(userAnswers.career_goal || userAnswers.goal),
                domainSpecific: {
                    hasWebExperience: userAnswers.coding_experience !== 'beginner',
                    preferredStack: userAnswers.tech_stack || "MERN",
                    projectType: userAnswers.project_type || "web_apps"
                }
            };
        } else {
            // For other domains - extract common patterns with enhanced mapping
            profile = {
                ...profile,
                experienceLevel: this.mapExperienceLevel(userAnswers.experience_level || userAnswers.coding_experience),
                learningPreference: this.mapLearningPreference(userAnswers.learning_preference || userAnswers.learning_style),
                primaryGoal: this.mapPrimaryGoal(userAnswers.career_goal || userAnswers.goal),
                domainSpecific: {
                    generalExperience: userAnswers.experience_level || "beginner",
                    preferredApproach: userAnswers.learning_preference || "hands_on"
                }
            };
        }

        console.log("🎯 Final profile for LLM:", {
            domain: profile.domain,
            hasCompleteProfile: profile.hasCompleteProfile,
            profileCompletion: profile.profileCompletion,
            experienceLevel: profile.experienceLevel,
            education: profile.education,
            skillsCount: profile.programmingLanguages?.length || 0,
            hasCareerGoals: !!(profile.careerGoals || profile.shortTermGoals),
            learningStyle: profile.learningStyle
        });

        return profile;
    }
    
    // Helper methods for enhanced mapping
    normalizeSkillsArray(skills) {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills.filter(skill => skill && skill.trim());
        if (typeof skills === 'string') return skills.split(',').map(s => s.trim()).filter(s => s);
        return [];
    }
    
    mapEducationLevel(education) {
        const educationMap = {
            'high_school': 'High School Graduate',
            'diploma': 'Diploma Holder', 
            'bachelor': 'Bachelor\'s Degree',
            'master': 'Master\'s Degree',
            'phd': 'PhD',
            'other': 'Other Education'
        };
        return educationMap[education] || education || 'Unknown';
    }
    
    mapExperienceLevel(experience) {
        const experienceMap = {
            'beginner': 'Complete Beginner',
            'some_experience': 'Some Experience',
            'intermediate': 'Intermediate Level',
            'advanced': 'Advanced Level', 
            'expert': 'Expert Level'
        };
        return experienceMap[experience] || experience || 'Beginner';
    }
    
    mapSpecialization(specialization) {
        const specializationMap = {
            'natural_language_processing': 'Natural Language Processing (NLP)',
            'computer_vision': 'Computer Vision',
            'deep_learning': 'Deep Learning',
            'machine_learning': 'General Machine Learning',
            'data_science': 'Data Science',
            'ai_research': 'AI Research'
        };
        return specializationMap[specialization] || specialization || 'General ML';
    }
    
    mapToolsFamiliarity(tools) {
        const toolsMap = {
            'tensorflow': 'TensorFlow',
            'pytorch': 'PyTorch', 
            'scikit_learn': 'Scikit-learn',
            'keras': 'Keras',
            'pandas': 'Pandas'
        };
        return toolsMap[tools] || tools || 'Basic Tools';
    }
    
    mapLearningPreference(preference) {
        const preferenceMap = {
            'hands_on_projects': 'Hands-on Projects',
            'theoretical_lectures': 'Theoretical Learning',
            'mixed_approach': 'Mixed Approach',
            'video_tutorials': 'Video Tutorials',
            'reading_documentation': 'Documentation & Reading'
        };
        return preferenceMap[preference] || preference || 'Mixed Approach';
    }
    
    mapPrimaryGoal(goal) {
        const goalMap = {
            'model_accuracy': 'Improve Model Accuracy',
            'model_interpretability': 'Model Interpretability',
            'deployment': 'Model Deployment',
            'career_switch': 'Career Transition',
            'skill_upgrade': 'Skill Enhancement',
            'research': 'Research & Development'
        };
        return goalMap[goal] || goal || 'General Skill Development';
    }
    
    mapEvaluationMetric(metric) {
        const metricMap = {
            'accuracy': 'Accuracy',
            'precision': 'Precision',
            'recall': 'Recall',
            'f1_score': 'F1 Score',
            'auc_roc': 'AUC-ROC'
        };
        return metricMap[metric] || metric || 'General Metrics';
    }
    
    buildAnswerBasedPrompt(userProfile, userAnswers) {
        const domain = userProfile.domain;
        
        console.log("🎯 Building enhanced prompt for LLM...");
        console.log("📊 Profile completeness:", userProfile.hasCompleteProfile ? `${userProfile.profileCompletion}%` : "Basic");
        
        let profileSection = "";
        
        if (userProfile.hasCompleteProfile && userProfile.profileCompletion > 30) {
            profileSection = `
## COMPREHENSIVE USER PROFILE (${userProfile.profileCompletion}% Complete):

### Personal Information:
- Name: ${userProfile.name || 'User'}
- Age: ${userProfile.age || 'Not provided'}
- Location: ${userProfile.location || 'Not specified'}

### Educational Background:
- Education Level: ${userProfile.education}
- Field of Study: ${userProfile.fieldOfStudy || 'Not specified'}
- Graduation Year: ${userProfile.graduationYear || 'Not specified'}
- Institution: ${userProfile.institution || 'Not specified'}
- Currently Studying: ${userProfile.currentlyStudying ? 'Yes' : 'No'}
- Certifications: ${userProfile.certifications?.length > 0 ? userProfile.certifications.join(', ') : 'None'}

### Professional Experience:
- Total Experience: ${userProfile.totalExperience || 0} years
- Current Role: ${userProfile.currentRole || 'Student/Fresher'}
- Industry: ${userProfile.industry || 'Not specified'}
- Work Type: ${userProfile.workType || 'Not specified'}
- Company Size: ${userProfile.companySize || 'Not specified'}

### Technical Skills & Expertise:
- Programming Languages: ${userProfile.programmingLanguages?.length > 0 ? userProfile.programmingLanguages.join(', ') : 'None specified'}
- Frameworks: ${userProfile.frameworks?.length > 0 ? userProfile.frameworks.join(', ') : 'None specified'}
- Tools & Platforms: ${userProfile.tools?.length > 0 ? userProfile.tools.join(', ') : 'None specified'}
- Databases: ${userProfile.databases?.length > 0 ? userProfile.databases.join(', ') : 'None specified'}
- Cloud Platforms: ${userProfile.cloudPlatforms?.length > 0 ? userProfile.cloudPlatforms.join(', ') : 'None specified'}

### Learning Preferences & Style:
- Learning Style: ${userProfile.learningStyle || 'Mixed approach'}
- Weekly Time Commitment: ${userProfile.weeklyTimeCommitment || '5-10 hours per week'}
- Preferred Schedule: ${userProfile.preferredSchedule || 'Flexible'}
- Resource Types: ${userProfile.resourceTypes?.length > 0 ? userProfile.resourceTypes.join(', ') : 'Mixed (videos, tutorials, projects)'}
- Difficulty Preference: ${userProfile.difficultyPreference || 'Progressive'}
- Learning Urgency: ${userProfile.urgency || 'Medium'}

### Career Goals & Aspirations:
- Primary Career Goal: ${userProfile.careerGoals || 'General skill development'}
- Short-term Goals: ${userProfile.shortTermGoals?.length > 0 ? userProfile.shortTermGoals.join(', ') : 'Not specified'}
- Long-term Goals: ${userProfile.longTermGoals?.length > 0 ? userProfile.longTermGoals.join(', ') : 'Not specified'}
- Target Roles: ${userProfile.targetRoles?.length > 0 ? userProfile.targetRoles.join(', ') : 'Not specified'}
- Target Industries: ${userProfile.targetIndustries?.length > 0 ? userProfile.targetIndustries.join(', ') : 'Not specified'}
- Work Location Preference: ${userProfile.workLocationPreference || 'Flexible'}

### Interests & Motivations:
- Primary Interests: ${userProfile.primaryInterests?.length > 0 ? userProfile.primaryInterests.join(', ') : 'Not specified'}
- Motivations: ${userProfile.motivations?.length > 0 ? userProfile.motivations.join(', ') : 'Career growth and skill development'}
- Challenge Areas: ${userProfile.challengeAreas?.length > 0 ? userProfile.challengeAreas.join(', ') : 'Not specified'}

### Domain-Specific Assessment Results:`;
            
            // Add domain-specific information
            if (domain.toLowerCase().includes('machine learning') || domain.toLowerCase().includes('ml')) {
                profileSection += `
- ML Experience Level: ${userProfile.experienceLevel}
- Specialization Interest: ${userProfile.specialization}
- Tools Familiarity: ${userProfile.toolsFamiliarity}
- Learning Approach: ${userProfile.learningPreference}
- Primary ML Goal: ${userProfile.primaryGoal}
- Evaluation Metric Focus: ${userProfile.evaluationFocus}
- Has Prior ML Experience: ${userProfile.domainSpecific?.hasMLExperience ? 'Yes' : 'No'}
- Preferred Framework: ${userProfile.domainSpecific?.preferredFramework || 'Not specified'}`;
            } else if (domain.toLowerCase().includes('web development')) {
                profileSection += `
- Web Development Experience: ${userProfile.experienceLevel}
- Specialization Area: ${userProfile.specialization}
- Framework Preference: ${userProfile.frameworkPreference || 'Not specified'}
- Learning Approach: ${userProfile.learningPreference}
- Career Goal: ${userProfile.primaryGoal}
- Has Web Experience: ${userProfile.domainSpecific?.hasWebExperience ? 'Yes' : 'No'}
- Preferred Tech Stack: ${userProfile.domainSpecific?.preferredStack || 'Not specified'}`;
            } else {
                profileSection += `
- Experience Level: ${userProfile.experienceLevel}
- Learning Preference: ${userProfile.learningPreference}
- Primary Goal: ${userProfile.primaryGoal}`;
            }
            
        } else {
            // Enhanced basic profile for incomplete profiles
            profileSection = `
## USER ASSESSMENT FOR ${domain.toUpperCase()}:

### Basic Information:
- Name: ${userProfile.name || 'User'}
- Domain: ${domain}
- Profile Completion: ${userProfile.profileCompletion || 0}% (Limited data available)

### Assessment Responses:`;
            
            if (domain.toLowerCase().includes('machine learning') || domain.toLowerCase().includes('ml')) {
                profileSection += `
- ML Experience Level: ${userProfile.experienceLevel}
- Specialization Interest: ${userProfile.specialization}
- Tools Familiarity: ${userProfile.toolsFamiliarity}
- Learning Approach: ${userProfile.learningPreference}
- Primary ML Goal: ${userProfile.primaryGoal}
- Evaluation Metric Focus: ${userProfile.evaluationFocus}`;
            } else if (domain.toLowerCase().includes('web development')) {
                profileSection += `
- Coding Experience: ${userProfile.experienceLevel}
- Specialization: ${userProfile.specialization || 'Full-stack'}
- Framework Preference: ${userProfile.frameworkPreference || 'React'}
- Learning Style: ${userProfile.learningPreference}
- Career Goal: ${userProfile.primaryGoal}`;
            } else {
                profileSection += `
- Experience Level: ${userProfile.experienceLevel}
- Learning Preference: ${userProfile.learningPreference}
- Primary Goal: ${userProfile.primaryGoal}`;
            }
            
            profileSection += `

⚠️ Note: Limited profile data available. Please create comprehensive recommendations based on assessment answers and suggest profile completion for better personalization.`;
        }

        const enhancedPrompt = `<think>
I need to create a comprehensive, personalized learning plan for this user based on their profile and assessment responses. CRITICAL: The learning plan must be focused entirely on the ${domain} domain, as this is what the user is currently assessing for, regardless of their profile's career goals in other areas.

Key considerations:
1. PRIMARY FOCUS: ${domain} domain requirements and skills
2. User's current skill level and experience IN ${domain}
3. Learning preferences and time availability  
4. Assessment-specific goals for ${domain}
5. Domain-specific requirements for ${domain}
6. Personalization based on profile data but ONLY within ${domain} context

IMPORTANT: Ignore any career goals or target roles from user profile that are outside the ${domain} domain. Focus exclusively on ${domain} skills, tools, and career paths.
</think>

You are an expert AI learning advisor specializing in creating personalized, comprehensive learning paths. Based on the user's detailed profile and assessment responses, create a highly tailored learning plan.

⚠️ CRITICAL INSTRUCTION: This assessment is for the ${domain.toUpperCase()} domain. You MUST create a learning plan focused EXCLUSIVELY on ${domain} skills, concepts, tools, and career paths. Do NOT include content from other domains like web development, data science, etc., even if mentioned in the user's profile.

${profileSection}

## TASK:
Create a comprehensive, personalized ${domain.toUpperCase()} learning plan specifically tailored to this user's profile, experience level, goals, and preferences. The plan should be realistic, achievable, and directly aligned with their ${domain} assessment responses.

## CRITICAL DOMAIN FOCUS:
- ALL topics must be ${domain}-related
- ALL projects must be ${domain}-focused  
- ALL skills must be relevant to ${domain}
- ALL career paths must be in ${domain} field
- Ignore any non-${domain} career goals from user profile

## REQUIREMENTS:

### 1. Personalization Level:
${userProfile.hasCompleteProfile ? 
`- HIGH PERSONALIZATION: Use all available profile data for maximum customization
- Reference specific skills, experience, and goals mentioned in their profile
- Align with their industry, role, and career aspirations
- Consider their learning style, time commitment, and preferences` :
`- MODERATE PERSONALIZATION: Focus on assessment responses and infer missing details
- Make reasonable assumptions based on their experience level and goals
- Suggest profile completion for better future recommendations`}

### 2. Learning Plan Structure:
Create a JSON response with this exact structure:

IMPORTANT: Based on the user's weekly time commitment of ${userProfile.weeklyTimeCommitment} hours and their ${userProfile.difficultyPreference} difficulty preference, create an appropriate length learning plan:
- For 10+ hours/week: Create 8-12 week comprehensive plan
- For 5-10 hours/week: Create 6-8 week detailed plan  
- For <5 hours/week: Create 4-6 week focused plan

{
  "assessment": {
    "currentLevel": "${userProfile.experienceLevel}",
    "strengths": [2-4 specific strengths based on their background],
    "improvementAreas": [3-5 specific areas to develop for their goals]
  },
  "weeklyPlan": {
    "week1": {
      "focus": "${domain} fundamentals - week 1 theme",
      "topics": ["${domain}-specific topic 1", "${domain}-specific topic 2", "${domain}-specific topic 3"],
      "dailySchedule": {
        "monday": "${domain} learning activity",
        "tuesday": "${domain} practice activity", 
        "wednesday": "${domain} hands-on activity"
      },
      "resources": [
        {
          "title": "${domain}-focused resource name",
          "type": "video|tutorial|book|documentation",
          "duration": "X hours",
          "difficulty": "beginner|intermediate|advanced"
        }
      ],
      "project": "${domain}-related hands-on project for week 1",
      "goals": ["${domain} learning objectives"]
    },
    "week2": { /* Similar structure */ },
    "week3": { /* Similar structure */ },
    "week4": { /* Similar structure */ },
    "week5": { /* Similar structure */ },
    "week6": { /* Similar structure */ },
    "week7": { /* Similar structure */ },
    "week8": { /* Similar structure */ }
    /* Continue up to week 8-12 based on time commitment */
  },
  "careerPath": {
    "nextRole": "Specific role aligned with their goals",
    "salaryRange": "Realistic range for their location/experience",
    "requiredSkills": [3-5 specific skills needed]
  },
  "milestones": [
    {
      "week": 4,
      "project": "${domain} Month 1 milestone project",
      "skills": ["${domain} skills demonstrated"]
    },
    {
      "week": 8,
      "project": "${domain} Month 2 milestone project", 
      "skills": ["${domain} skills demonstrated"]
    },
    {
      "week": 12,
      "project": "${domain} Final capstone project",
      "skills": ["${domain} advanced skills demonstrated"]
    }
  ]
}

### 3. Content Quality Requirements:
- **Specific & Actionable**: Every recommendation should be concrete and actionable
- **Progressive Difficulty**: Start at their current level and build complexity
- **Time-Realistic**: Align with their available time commitment (${userProfile.weeklyTimeCommitment} hours/week)
- **Duration-Appropriate**: With ${userProfile.weeklyTimeCommitment} hours weekly, create a comprehensive ${userProfile.weeklyTimeCommitment >= 10 ? '8-12 week' : userProfile.weeklyTimeCommitment >= 5 ? '6-8 week' : '4-6 week'} learning journey
- **Goal-Oriented**: Every element should advance their stated goals
- **Resource Variety**: Mix different learning formats based on their preferences
- **Industry-Relevant**: Use real-world, current industry practices
- **Measurable Outcomes**: Clear success criteria for each week/milestone
- **Gradual Progression**: Honor their ${userProfile.difficultyPreference} difficulty preference

### 4. Personalization Factors to Consider:
- DOMAIN FOCUS: ${domain} skills and concepts only
- Current ${domain} experience: ${userProfile.experienceLevel}
- Time availability: ${userProfile.weeklyTimeCommitment}
- Learning style: ${userProfile.learningStyle}
- ${domain}-specific goal: ${userProfile.primaryGoal || 'Domain mastery'}
${userProfile.hasCompleteProfile ? `- Technical background: ${userProfile.programmingLanguages?.join(', ') || 'None specified'} (adapt for ${domain} use)
- Current role: ${userProfile.currentRole} (transitioning to ${domain})
- Industry context: Target ${domain} industry roles` : ''}

Create a ${domain.toUpperCase()} learning plan that this specific user would find valuable, achievable, and directly relevant to their ${domain} goals. Make it feel personally crafted for their ${domain} journey, not generic or focused on other domains.`;

        console.log("✅ Enhanced prompt built with comprehensive profile data");
        return enhancedPrompt;
    }

    async callLLMAPI(prompt) {
        if (this.apiKey && this.apiKey.startsWith("gsk_")) {
            return await this.callGroq(prompt);
        } else {
            return await this.callEnhancedMockLLM(prompt);
        }
    }

    async callGroq(prompt) {
        try {
            console.log("🚀 Calling Groq API with SDK for learning plan generation...");
            
            const { Groq } = require("groq-sdk");
            const groq = new Groq({
                apiKey: this.apiKey
            });
            
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert learning advisor who creates detailed, actionable learning plans based on user answers. Always provide specific, practical guidance with real resources. Respond ONLY in English language. Be professional and clear."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: this.temperature,
                max_completion_tokens: this.maxTokens,
                top_p: 0.95,
                stream: false,
                stop: null
            });

            console.log("✅ Groq API response received successfully");
            return chatCompletion.choices[0].message.content;
        } catch (error) {
            console.error("❌ Groq API failed:", error.message);
            console.error("🔄 Falling back to enhanced mock LLM...");
            return await this.callEnhancedMockLLM(prompt);
        }
    }

    async callEnhancedMockLLM(prompt) {
        console.log("🤖 Using enhanced mock LLM response with Groq-style quality");
        
        const skills = this.extractSkillsFromPrompt(prompt);
        const timeCommitment = this.extractTimeFromPrompt(prompt);
        const experience = this.extractExperienceFromPrompt(prompt);
        
        return this.generatePersonalizedPlan(skills, timeCommitment, experience);
    }

    extractSkillsFromPrompt(prompt) {
        const skillPatterns = ["JavaScript", "Python", "React", "Node.js", "HTML", "CSS", "Java", "C++"];
        return skillPatterns.filter(skill => prompt.toLowerCase().includes(skill.toLowerCase()));
    }

    extractTimeFromPrompt(prompt) {
        if (prompt.includes("20+") || prompt.includes("intensive")) return "intensive";
        if (prompt.includes("10-20") || prompt.includes("moderate")) return "moderate";
        return "casual";
    }

    extractExperienceFromPrompt(prompt) {
        if (prompt.includes("beginner") || prompt.includes("0")) return "beginner";
        if (prompt.includes("2-5") || prompt.includes("intermediate")) return "intermediate";
        return "advanced";
    }

    generatePersonalizedPlan(skills, timeCommitment, experience) {
        const skillsText = skills.length > 0 ? skills.join(", ") : "web development technologies";
        const firstSkill = skillsText.split(",")[0] || "HTML";
        
        return JSON.stringify({
            assessment: {
                currentLevel: experience,
                strengths: ["Problem solving", "Learning motivation"],
                improvementAreas: [skillsText, "Project experience"]
            },
            weeklyPlan: {
                week1: {
                    focus: "Foundation Building",
                    topics: [firstSkill, "CSS Basics", "JavaScript Fundamentals"],
                    dailySchedule: {
                        monday: "2 hours tutorial videos + 1 hour practice",
                        tuesday: "2 hours documentation reading + 1 hour coding",
                        wednesday: "3 hours hands-on project work"
                    },
                    resources: [
                        {
                            title: firstSkill + " Complete Course",
                            type: "video",
                            duration: "3 hours",
                            difficulty: experience
                        }
                    ],
                    project: "Build a responsive landing page",
                    goals: ["Master " + firstSkill + " basics", "Create first project"]
                }
            },
            milestones: [
                {
                    week: 4,
                    project: `${skillsText} Capstone Project`,
                    skills: [firstSkill, "practical application", "project completion"]
                }
            ],
            careerPath: {
                nextRole: "Junior Developer",
                salaryRange: "$45k-65k",
                requiredSkills: [skillsText, "Git", "Problem Solving"]
            }
        });
    }

    async parseAndEnhanceLearningPlan(llmResponse, userProfile) {
        try {
            console.log("🔍 Parsing LLM response...");
            console.log("🔍 Raw response length:", llmResponse.length);
            
            // Clean the response first
            let cleanResponse = llmResponse.trim();
            
            // Remove any thinking tags if present
            cleanResponse = cleanResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
            cleanResponse = cleanResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
            
            // Try multiple JSON extraction methods
            let jsonString = null;
            
            // Method 1: Look for complete JSON object with better regex
            const jsonMatch1 = cleanResponse.match(/\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/);
            if (jsonMatch1) {
                jsonString = jsonMatch1[0];
                console.log("📊 Method 1: Found JSON match with balanced braces");
            }
            
            // Method 2: Look for JSON between specific markers
            if (!jsonString) {
                const jsonMatch2 = cleanResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch2) {
                    jsonString = jsonMatch2[1];
                    console.log("📊 Method 2: Found JSON in code block");
                }
            }
            
            // Method 3: Try to find JSON starting from first {
            if (!jsonString) {
                const startIndex = cleanResponse.indexOf('{');
                const endIndex = cleanResponse.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    jsonString = cleanResponse.substring(startIndex, endIndex + 1);
                    console.log("📊 Method 3: Extracted JSON by position");
                }
            }
            
            if (jsonString) {
                console.log("📊 Attempting to parse JSON...");
                console.log("🔍 JSON string preview:", jsonString.substring(0, 200) + "...");
                
                const parsedPlan = JSON.parse(jsonString);
                console.log("✅ JSON parsed successfully, keys:", Object.keys(parsedPlan));
                
                // Handle different response formats
                if (parsedPlan.learning_plan) {
                    console.log("🔄 Found nested learning_plan, extracting...");
                    return parsedPlan.learning_plan;
                } else if (parsedPlan.weeklyPlan || parsedPlan.assessment || parsedPlan.careerPath) {
                    console.log("✅ Found direct structure format");
                    return parsedPlan;
                } else {
                    console.log("⚠️ Incomplete JSON structure, keys:", Object.keys(parsedPlan));
                    console.log("🔄 Attempting to adapt or rebuild structure...");
                    
                    // Check if LLM returned partial JSON (just assessment part)
                    if (parsedPlan.currentLevel || parsedPlan.strengths || parsedPlan.improvementAreas) {
                        console.log("🔄 Detected assessment-only response, building complete structure...");
                        return this.buildCompleteStructureFromPartial(parsedPlan, userProfile);
                    }
                    
                    // Try to adapt the structure
                    return this.adaptUnknownStructure(parsedPlan, userProfile);
                }
            } else {
                console.log("⚠️ No JSON found in LLM response, using basic plan");
                return this.generateBasicStructuredPlan(userProfile);
            }
        } catch (error) {
            console.error("❌ Failed to parse LLM response:", error);
            console.log("🔄 Falling back to basic structured plan");
            return this.generateBasicStructuredPlan(userProfile);
        }
    }

    buildCompleteStructureFromPartial(partialPlan, userProfile) {
        console.log("🔧 Building complete structure from partial LLM response...");
        
        const domain = userProfile?.domain || 'Web Development';
        let basicSkills = [];
        let focusArea = "";
        
        if (domain.toLowerCase().includes('cyber') || domain.toLowerCase().includes('security')) {
            basicSkills = ["Network Security", "Ethical Hacking", "Penetration Testing", "Cybersecurity Fundamentals", "Security Analysis"];
            focusArea = "Cybersecurity";
        } else if (domain.toLowerCase().includes('web') || domain.toLowerCase().includes('front')) {
            basicSkills = ["HTML", "CSS", "JavaScript", "React", "Node.js"];
            focusArea = "Web Development";
        } else {
            basicSkills = ["Programming Basics", "Problem Solving", "Software Development"];
            focusArea = domain;
        }
        
        const completeStructure = {
            assessment: {
                currentLevel: partialPlan.currentLevel || userProfile?.experienceLevel || "Beginner",
                strengths: partialPlan.strengths || ["Motivation to Learn", "Goal-oriented Mindset"],
                improvementAreas: partialPlan.improvementAreas || ["Technical Skills", "Practical Experience", "Industry Knowledge"]
            },
            weeklyPlan: this.generateBasicWeeklyPlan(focusArea, basicSkills),
            milestones: [
                {
                    week: 4,
                    title: "Foundation Complete",
                    description: `Master ${focusArea} fundamentals and basic concepts`,
                    project: `Basic ${focusArea} project`
                },
                {
                    week: 8,
                    title: "Intermediate Skills",
                    description: `Build practical ${focusArea} projects and gain hands-on experience`,
                    project: `Intermediate ${focusArea} application`
                },
                {
                    week: 12,
                    title: "Advanced Concepts",
                    description: `Develop industry-ready skills and portfolio projects`,
                    project: `Advanced ${focusArea} portfolio piece`
                }
            ],
            careerPath: {
                nextRole: `Junior ${focusArea} Specialist`,
                salaryRange: focusArea.includes('Cyber') ? "$55k-75k" : "$45k-65k",
                requiredSkills: basicSkills
            }
        };
        
        console.log("✅ Complete structure built from partial response");
        return completeStructure;
    }

    adaptUnknownStructure(parsedPlan, userProfile) {
        console.log("🔧 Adapting unknown JSON structure...");
        console.log("🔍 Parsed plan keys:", Object.keys(parsedPlan));
        console.log("🔍 Parsed plan sample:", JSON.stringify(parsedPlan, null, 2).substring(0, 500));
        
        // Handle case where response is just assessment data
        if (parsedPlan.currentLevel || parsedPlan.strengths || parsedPlan.improvementAreas) {
            console.log("🔄 Detected assessment-only response, building full structure...");
            
            const domain = userProfile?.domain || 'Web Development';
            let basicSkills = [];
            let focusArea = "";
            
            if (domain.toLowerCase().includes('cyber') || domain.toLowerCase().includes('security')) {
                basicSkills = ["Network Security", "Ethical Hacking", "Penetration Testing", "Cybersecurity Fundamentals"];
                focusArea = "Cybersecurity";
            } else {
                basicSkills = ["HTML", "CSS", "JavaScript", "React"];
                focusArea = "Web Development";
            }
            
            return {
                assessment: {
                    currentLevel: parsedPlan.currentLevel || "Beginner",
                    strengths: parsedPlan.strengths || [],
                    improvementAreas: parsedPlan.improvementAreas || []
                },
                weeklyPlan: this.generateBasicWeeklyPlan(focusArea, basicSkills),
                milestones: [
                    {
                        week: 4,
                        title: "Foundation Complete",
                        description: `Complete ${focusArea} basics`
                    },
                    {
                        week: 8,
                        title: "Intermediate Skills", 
                        description: "Build practical projects"
                    },
                    {
                        week: 12,
                        title: "Advanced Concepts",
                        description: "Industry-ready skills"
                    }
                ],
                careerPath: {
                    nextRole: `Junior ${focusArea} Specialist`,
                    salaryRange: "$45k-65k",
                    requiredSkills: basicSkills
                }
            };
        }
        
        // Try to extract useful information from any other structure
        const adapted = {
            assessment: parsedPlan.assessment || {
                currentLevel: parsedPlan.currentLevel || "unknown",
                strengths: parsedPlan.strengths || [],
                improvementAreas: parsedPlan.improvementAreas || []
            },
            weeklyPlan: parsedPlan.weeklyPlan || parsedPlan.schedule || {},
            milestones: parsedPlan.milestones || parsedPlan.goals || [],
            careerPath: parsedPlan.careerPath || parsedPlan.career || {
                nextRole: "",
                salaryRange: "",
                requiredSkills: []
            }
        };
        
        console.log("✅ Adapted structure created");
        return adapted;
    }

    generateBasicStructuredPlan(userProfile) {
        // Return structured plan with meaningful fallback data based on user profile
        console.log("⚠️ [FALLBACK] Generating basic structured plan with profile-based data");
        
        // Determine domain-specific content
        const domain = userProfile?.domain || 'Web Development';
        console.log("🎯 Generating fallback for domain:", domain);
        
        let basicSkills = [];
        let basicProjects = [];
        let focusArea = "";
        
        if (domain.toLowerCase().includes('cyber') || domain.toLowerCase().includes('security')) {
            basicSkills = ["Network Security", "Ethical Hacking", "Penetration Testing", "Cybersecurity Fundamentals"];
            basicProjects = ["Security Audit", "Network Monitoring", "Vulnerability Assessment"];
            focusArea = "Cybersecurity";
        } else {
            basicSkills = ["HTML", "CSS", "JavaScript", "React"];
            basicProjects = ["Portfolio Website", "Todo App", "E-commerce Site"];
            focusArea = "Web Development";
        }
        
        return {
            assessment: {
                currentLevel: userProfile?.experienceLevel || "Beginner",
                strengths: ["Motivation to Learn", "Goal-oriented"],
                improvementAreas: ["Technical Skills", "Practical Experience"]
            },
            weeklyPlan: this.generateBasicWeeklyPlan(focusArea, basicSkills),
            milestones: [
                {
                    week: 4,
                    title: "Foundation Complete",
                    description: `Complete ${focusArea} basics`
                },
                {
                    week: 8,
                    title: "Intermediate Skills",
                    description: "Build practical projects"
                },
                {
                    week: 12,
                    title: "Advanced Concepts",
                    description: "Industry-ready skills"
                }
            ],
            careerPath: {
                nextRole: `Junior ${focusArea} Specialist`,
                salaryRange: "$45k-65k",
                requiredSkills: basicSkills
            }
        };
    }

    generateBasicWeeklyPlan(focusArea = "Web Development", skills = ["HTML", "CSS", "JavaScript"]) {
        const weeks = {};
        const skillsPerWeek = Math.ceil(skills.length / 4); // Distribute skills across first 4 weeks
        
        for (let i = 1; i <= 12; i++) {
            let weekFocus = "";
            let weekTopics = [];
            
            if (i <= 4) {
                // Foundation weeks
                const skillIndex = (i - 1) * skillsPerWeek;
                weekTopics = skills.slice(skillIndex, skillIndex + skillsPerWeek);
                
                // Handle case where no topics are available for this week
                if (weekTopics.length > 0) {
                    weekFocus = `Week ${i}: ${weekTopics[0]} Fundamentals`;
                } else {
                    weekFocus = `Week ${i}: ${focusArea} Review and Practice`;
                    weekTopics = ["Review and Practice", "Concept Reinforcement"];
                }
            } else if (i <= 8) {
                // Practice weeks
                weekFocus = `Week ${i}: Practical Application`;
                weekTopics = ["Hands-on Projects", "Code Practice", "Problem Solving"];
            } else {
                // Advanced weeks
                weekFocus = `Week ${i}: Advanced Concepts`;
                weekTopics = ["Advanced Topics", "Industry Practices", "Portfolio Building"];
            }
            
            weeks[`week${i}`] = {
                focus: weekFocus,
                topics: weekTopics,
                dailySchedule: {
                    monday: "2 hours theory and tutorials",
                    tuesday: "2 hours hands-on practice", 
                    wednesday: "2 hours project work",
                    thursday: "1 hour review and testing",
                    friday: "2 hours community learning"
                },
                project: i <= 4 ? "Basic exercises" : i <= 8 ? "Mini projects" : "Portfolio projects",
                goals: weekTopics.length > 0 ? [`Master ${weekTopics[0]}`, "Complete weekly exercises", "Track progress"] : ["Review concepts", "Complete weekly exercises", "Track progress"]
            };
        }
        return weeks;
    }

    async enhanceWithRealWebSearch(structuredPlan, userProfile) {
        try {
            const topics = this.extractTopicsFromPlan(structuredPlan);
            const realResources = await this.searchInternetWithLLM(topics, userProfile);
            
            // Merge real resources into learning recommendations
            const enhancedLearningRecommendations = this.mergeRealResourcesIntoRecommendations(
                structuredPlan.learningRecommendations || [],
                realResources
            );
            
            return {
                ...structuredPlan,
                realTimeResources: realResources,
                learningRecommendations: enhancedLearningRecommendations,
                enhanced: true
            };
        } catch (error) {
            console.error("Failed to enhance with real web search:", error);
            return structuredPlan;
        }
    }

    mergeRealResourcesIntoRecommendations(originalRecommendations, realResources) {
        const enhancedRecommendations = [];
        
        // Add real resources first (they're better quality)
        Object.entries(realResources).forEach(([topic, resources]) => {
            if (Array.isArray(resources)) {
                resources.forEach(resource => {
                    enhancedRecommendations.push({
                        title: resource.title,
                        description: resource.description,
                        priority: "High",
                        estimatedTime: resource.duration || "2-4 hours",
                        url: resource.url,
                        type: resource.type,
                        provider: resource.provider,
                        thumbnail: resource.thumbnail,
                        difficulty: resource.difficulty,
                        score: resource.score,
                        isRealTime: true
                    });
                });
            }
        });
        
        // Add original recommendations as fallback (with #)
        originalRecommendations.forEach(rec => {
            if (rec.url === "#") {
                rec.isRealTime = false;
            }
            enhancedRecommendations.push(rec);
        });
        
        return enhancedRecommendations;
    }

    extractTopicsFromPlan(plan) {
        const topics = [];
        
        if (plan.weeklyPlan) {
            Object.values(plan.weeklyPlan).forEach(week => {
                if (week.topics) {
                    topics.push(...week.topics);
                }
            });
        }
        
        // Don't limit to 5, get ALL topics for comprehensive resource generation
        return [...new Set(topics)];
    }

    async searchInternetWithLLM(topics, userProfile) {
        console.log("🔍 Performing real internet search for topics...");
        const allResources = {};
        
        for (const topic of topics) {
            try {
                console.log(`🌐 Searching internet for: ${topic}`);
                const topicResources = await this.webSearch.searchForLearningResources(topic, 'all');
                allResources[topic] = topicResources;
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Search failed for ${topic}:`, error);
                allResources[topic] = this.webSearch.generateFallbackResources(topic);
            }
        }
        
        return allResources;
    }

    generateFallbackLearningPath(userAnswers, sessionData) {
        return {
            success: false,
            learningPath: {
                weeklyPlan: this.generateBasicWeeklyPlan(),
                realTimeResources: {},
                fallback: true
            },
            userProfile: this.extractUserProfile(userAnswers, sessionData),
            generatedAt: new Date().toISOString(),
            source: "fallback_system"
        };
    }

    /**
     * Generate detailed learning plan based on user profile and recommendation
     * @param {Object} userProfile - User profile data
     * @param {Object} recommendation - Base recommendation
     * @returns {Object} - Enhanced learning plan
     */
    async generateDetailedLearningPlan(userProfile, recommendation) {
        console.log('🎯 Generating detailed learning plan with LLM...');
        
        try {
            const prompt = this.buildDetailedPlanPrompt(userProfile, recommendation);
            const llmResponse = await this.callLLMAPI(prompt);
            
            const enhancedPlan = {
                weeklyPlan: this.parseWeeklyPlan(llmResponse),
                detailedPlan: llmResponse,
                realTimeResources: await this.searchForPlanResources(recommendation.skills || []),
                searchPerformed: true,
                lastUpdated: new Date().toISOString()
            };
            
            return enhancedPlan;
        } catch (error) {
            console.error('❌ Failed to generate detailed plan:', error.message);
            return {
                weeklyPlan: this.generateBasicWeeklyPlan(),
                detailedPlan: `Based on your ${userProfile.experience} experience and ${userProfile.timeCommitment} weekly commitment, focus on: ${recommendation.skills?.join(', ') || 'web development fundamentals'}.`,
                realTimeResources: {},
                searchPerformed: false,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    buildDetailedPlanPrompt(userProfile, recommendation) {
        return `Create a detailed learning plan for a web developer with the following profile:

Education: ${userProfile.education}
Experience: ${userProfile.experience}
Time Commitment: ${userProfile.timeCommitment}
Career Goals: ${userProfile.careerGoals}
Learning Style: ${userProfile.learningStyle}

Based on these recommended skills: ${recommendation.skills?.join(', ') || 'HTML, CSS, JavaScript'}

Please provide a structured learning plan with:
1. Weekly breakdown for the first 8 weeks
2. Specific topics for each week
3. Practical projects
4. Estimated hours per week

Respond ONLY in English. Format as a clear, actionable plan.`;
    }

    parseWeeklyPlan(llmResponse) {
        // Basic parsing logic - can be enhanced
        const weeks = {};
        for (let i = 1; i <= 8; i++) {
            weeks[`week${i}`] = {
                focus: `Week ${i} Learning Focus`,
                topics: [`Topic ${i}.1`, `Topic ${i}.2`],
                project: `Week ${i} Project`,
                hours: 10
            };
        }
        return weeks;
    }

    async searchForPlanResources(skills) {
        const resources = {};
        for (const skill of skills.slice(0, 3)) { // Limit to 3 skills
            try {
                resources[skill] = await this.webSearch.searchForLearningResources(skill, 'all');
            } catch (error) {
                resources[skill] = [];
            }
        }
        return resources;
    }
}

module.exports = LLMPlanningService;
