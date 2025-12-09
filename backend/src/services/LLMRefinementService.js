const Groq = require('groq-sdk');

class LLMRefinementService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    this.model = process.env.GROQ_MODEL || 'deepseek-r1-distill-llama-70b';
    this.maxRetries = 2;
  }

  /**
   * Sanitize user profile for LLM processing
   * Remove PII and convert to labeled facts
   */
  sanitizeUserProfile(session) {
    const profile = {
      domain: session.domainId?.name || 'Unknown Domain',
      educationLevel: this.getEducationLabel(session.answers.get('education_level')),
      experienceYears: this.getExperienceLabel(session.answers.get('coding_experience')),
      weeklyHours: this.getCommitmentLabel(session.answers.get('weekly_hours')),
      focusArea: this.getFocusLabel(session.answers.get('web_dev_focus')),
      careerGoal: this.getCareerGoalLabel(session.answers.get('career_goal')),
      learningStyle: this.getLearningStyleLabel(session.answers.get('learning_style'))
    };

    return profile;
  }

  /**
   * Extract top N trace items for context
   */
  extractTopTraceItems(appliedRules, maxItems = 5) {
    if (!appliedRules || !Array.isArray(appliedRules)) {
      return [];
    }

    return appliedRules
      .slice(0, maxItems)
      .map(rule => ({
        ruleName: rule.name,
        priority: rule.priority,
        contribution: rule.contribution,
        reasoning: `Applied due to user's ${rule.contribution} match criteria`
      }));
  }

  /**
   * Build LLM prompt for recommendation refinement
   */
  buildRefinementPrompt(sanitizedProfile, baseRecommendation, traceItems) {
    const prompt = `You are a career roadmap formatter for technical learning paths. Your role is to format and explain recommendations based ONLY on the provided base recommendation and rule trace. Do not invent facts, certifications, or resources not implied by the input.

**USER PROFILE:**
- Domain: ${sanitizedProfile.domain}
- Education: ${sanitizedProfile.educationLevel}
- Experience: ${sanitizedProfile.experienceYears}
- Time Commitment: ${sanitizedProfile.weeklyHours}
- Focus Area: ${sanitizedProfile.focusArea}
- Career Goal: ${sanitizedProfile.careerGoal}
- Learning Preference: ${sanitizedProfile.learningStyle}

**BASE RECOMMENDATION (from inference engine):**
Skills: ${baseRecommendation.skills?.join(', ') || 'None specified'}
Resources: ${baseRecommendation.resources?.join(', ') || 'None specified'}
Projects: ${baseRecommendation.projects?.join(', ') || 'None specified'}
Timeline: ${baseRecommendation.timeline || 'Not specified'}

**APPLIED RULES (reasoning trace):**
${traceItems.map((item, i) => `${i + 1}. ${item.ruleName} (Priority: ${item.priority}) - ${item.reasoning}`).join('\n')}

**TASK:** Format this into a structured learning roadmap with these exact sections:

**1. PRIORITY SKILLS (3-5 skills from base recommendation):**
- [List 3-5 most important skills, prioritized by career goal]

**2. LEARNING RESOURCES (3 resources with real providers):**
- [Suggest 3 realistic resources - use general provider names like "Official Documentation", "Interactive Tutorials", "Video Courses"]

**3. PRACTICE PROJECTS (2 mini-projects):**
- [2 small project ideas that reinforce the priority skills]

**4. 12-WEEK TIMELINE:**
Weeks 1-3: [milestone]
Weeks 4-6: [milestone]
Weeks 7-9: [milestone]
Weeks 10-12: [milestone]

**5. WHY THIS PATH:**
[One paragraph explaining why this path fits the user profile, referencing the applied rules]

**CONSTRAINTS:**
- Use ONLY information from base recommendation and trace
- Do not invent specific course names, URLs, or certifications
- Keep resource names generic but realistic
- Be concise and actionable
- List any assumptions made

**ASSUMPTIONS:**
- [List any assumptions about user context]`;

    return prompt;
  }

  /**
   * Call Groq API with retry logic
   */
  async callGroq(prompt, attempt = 1) {
    try {
      console.log(`🤖 Calling Groq (attempt ${attempt}/${this.maxRetries + 1})...`);
      
      const completion = await this.groq.chat.completions.create({
        messages: [{
          role: "user",
          content: prompt
        }],
        model: this.model,
        temperature: 0.3, // Lower temperature for more consistent formatting
        max_tokens: 2000,
        top_p: 0.9
      });

      const response = completion.choices[0]?.message?.content;
      
      if (response) {
        console.log('✅ Groq response received');
        return response;
      } else {
        throw new Error('Empty response from Groq');
      }

    } catch (error) {
      console.error(`❌ Groq attempt ${attempt} failed:`, error.message);
      
      if (attempt <= this.maxRetries) {
        console.log(`🔄 Retrying Groq call...`);
        await this.delay(2000 * attempt); // Exponential backoff
        return this.callGroq(prompt, attempt + 1);
      }
      
      throw new Error(`Groq failed after ${this.maxRetries + 1} attempts: ${error.message}`);
    }
  }

  /**
   * Validate LLM response structure
   */
  validateResponse(llmResponse) {
    const requiredSections = [
      'PRIORITY SKILLS',
      'LEARNING RESOURCES', 
      'PRACTICE PROJECTS',
      'WEEK TIMELINE',
      'WHY THIS PATH'
    ];

    const validationResult = {
      isValid: true,
      missingSections: [],
      hasStructure: false
    };

    // Check for required sections
    for (const section of requiredSections) {
      if (!llmResponse.includes(section)) {
        validationResult.missingSections.push(section);
        validationResult.isValid = false;
      }
    }

    // Check for basic structure
    validationResult.hasStructure = llmResponse.includes('**') && llmResponse.includes(':');

    return validationResult;
  }

  /**
   * Parse structured response from LLM
   */
  parseStructuredResponse(llmResponse) {
    const sections = {
      prioritySkills: this.extractSection(llmResponse, 'PRIORITY SKILLS'),
      learningResources: this.extractSection(llmResponse, 'LEARNING RESOURCES'),
      practiceProjects: this.extractSection(llmResponse, 'PRACTICE PROJECTS'),
      timeline: this.extractSection(llmResponse, '12-WEEK TIMELINE') || this.extractSection(llmResponse, 'WEEK TIMELINE'),
      whyThisPath: this.extractSection(llmResponse, 'WHY THIS PATH'),
      assumptions: this.extractSection(llmResponse, 'ASSUMPTIONS')
    };

    return sections;
  }

  /**
   * Extract content between section headers
   */
  extractSection(text, sectionName) {
    const regex = new RegExp(`\\*\\*\\d*\\.?\\s*${sectionName}[^:]*:\\*\\*([\\s\\S]*?)(?=\\*\\*\\d*\\.|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Main refinement method
   */
  async refineRecommendation(session, baseRecommendation, inferenceTrace) {
    try {
      console.log('🎨 Starting LLM refinement...');
      
      // Step 1: Sanitize user profile
      const sanitizedProfile = this.sanitizeUserProfile(session);
      console.log('✅ Profile sanitized');

      // Step 2: Extract top trace items
      const traceItems = this.extractTopTraceItems(baseRecommendation.metadata?.appliedRules, 5);
      console.log(`✅ Extracted ${traceItems.length} trace items`);

      // Step 3: Build prompt
      const prompt = this.buildRefinementPrompt(sanitizedProfile, baseRecommendation, traceItems);
      
      // Step 4: Call LLM
      const llmResponse = await this.callGroq(prompt);
      
      // Step 5: Validate response
      const validation = this.validateResponse(llmResponse);
      
      if (!validation.isValid && validation.missingSections.length > 0) {
        console.log('⚠️ Initial response validation failed, retrying with stricter prompt...');
        
        const stricterPrompt = prompt + `\n\nIMPORTANT: Your response MUST include all five sections with the exact headers shown above. Missing sections: ${validation.missingSections.join(', ')}`;
        const retryResponse = await this.callGroq(stricterPrompt);
        
        const retryValidation = this.validateResponse(retryResponse);
        if (retryValidation.isValid) {
          console.log('✅ Retry successful');
          return this.parseStructuredResponse(retryResponse);
        } else {
          console.log('⚠️ Retry validation also failed, using base response');
          return this.parseStructuredResponse(llmResponse);
        }
      }

      console.log('✅ LLM refinement completed successfully');
      return this.parseStructuredResponse(llmResponse);

    } catch (error) {
      console.error('❌ LLM refinement failed:', error.message);
      
      // Return structured fallback
      return this.createFallbackResponse(baseRecommendation, inferenceTrace);
    }
  }

  /**
   * Create fallback response when LLM fails
   */
  createFallbackResponse(baseRecommendation, inferenceTrace) {
    console.log('🔄 Creating fallback response...');
    
    return {
      prioritySkills: baseRecommendation.skills?.slice(0, 5).join('\n- ') || 'Skills not available',
      learningResources: baseRecommendation.resources?.slice(0, 3).join('\n- ') || 'Resources not available',
      practiceProjects: baseRecommendation.projects?.slice(0, 2).join('\n- ') || 'Projects not available',
      timeline: `Timeline: ${baseRecommendation.timeline || 'Not specified'}\n\nNote: Detailed weekly breakdown unavailable in fallback mode.`,
      whyThisPath: `This learning path was generated by our inference engine based on your profile and matched against our expert rule base. ${baseRecommendation.metadata?.appliedRules?.length || 0} rules were applied to create these recommendations.`,
      assumptions: 'LLM unavailable — showing base plan from inference engine',
      fallback: true
    };
  }

  // Helper methods for sanitization
  getEducationLabel(value) {
    const labels = {
      'high_school': 'High School',
      'bachelors': 'Bachelor\'s Degree',
      'masters': 'Master\'s Degree',
      'phd': 'PhD',
      'bootcamp': 'Bootcamp Graduate',
      'self_taught': 'Self-Taught'
    };
    return labels[value] || 'Not specified';
  }

  getExperienceLabel(value) {
    if (!value) return 'Not specified';
    const years = parseInt(value);
    if (years === 0) return 'Complete Beginner';
    if (years <= 2) return 'Beginner (0-2 years)';
    if (years <= 5) return 'Intermediate (2-5 years)';
    return 'Advanced (5+ years)';
  }

  getCommitmentLabel(value) {
    if (!value) return 'Not specified';
    const hours = parseInt(value);
    if (hours <= 5) return 'Light (≤5 hours/week)';
    if (hours <= 15) return 'Moderate (6-15 hours/week)';
    if (hours <= 25) return 'Serious (16-25 hours/week)';
    return 'Intensive (25+ hours/week)';
  }

  getFocusLabel(value) {
    const labels = {
      'frontend': 'Frontend Development',
      'backend': 'Backend Development', 
      'fullstack': 'Full-Stack Development',
      'mobile': 'Mobile Development',
      'data': 'Data Science',
      'unsure': 'Exploring Options'
    };
    return labels[value] || 'Not specified';
  }

  getCareerGoalLabel(value) {
    const labels = {
      'job_switch': 'Career Change',
      'promotion': 'Career Advancement',
      'freelance': 'Freelancing',
      'startup': 'Entrepreneurship',
      'learning': 'Skill Building'
    };
    return labels[value] || 'Not specified';
  }

  getLearningStyleLabel(value) {
    if (!Array.isArray(value)) return 'Not specified';
    const styles = {
      'visual': 'Visual Learning',
      'hands_on': 'Hands-on Practice',
      'reading': 'Reading & Documentation',
      'video_courses': 'Video Courses',
      'interactive': 'Interactive Tutorials'
    };
    return value.map(v => styles[v] || v).join(', ');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Answer clarifying questions about the recommendation
   * @param {Object} session - User session
   * @param {string} question - User's question
   * @param {Object} baseRecommendation - Original inference result
   * @param {Object} refinedRecommendation - LLM refined result
   * @returns {Object} Clarification response
   */
  async answerClarifyingQuestion(session, question, baseRecommendation, refinedRecommendation) {
    try {
      console.log('🤔 Answering clarifying question...');
      
      // Sanitize user profile
      const sanitizedProfile = this.sanitizeUserProfile(session);
      
      // Build clarification prompt
      const prompt = this.buildClarificationPrompt(
        sanitizedProfile,
        question,
        baseRecommendation,
        refinedRecommendation
      );
      
      // Call Groq for clarification
      const response = await this.callGroq(prompt);
      
      return {
        answer: response.trim(),
        confidence: 'medium', // Could be enhanced with confidence detection
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Clarification failed:', error.message);
      return {
        answer: 'I apologize, but I\'m unable to provide a clarification at this time. Please refer to your original recommendation or contact support.',
        confidence: 'low',
        error: true,
        generatedAt: new Date()
      };
    }
  }

  /**
   * Build prompt for answering clarifying questions
   * @param {Object} sanitizedProfile - User profile
   * @param {string} question - User's question
   * @param {Object} baseRecommendation - Base recommendation
   * @param {Object} refinedRecommendation - Refined recommendation
   * @returns {string} Complete prompt
   */
  buildClarificationPrompt(sanitizedProfile, question, baseRecommendation, refinedRecommendation) {
    return `You are a career guidance counselor helping to clarify questions about a personalized learning roadmap. Answer ONLY based on the provided recommendation data - do not invent new information.

**USER PROFILE:**
- Domain: ${sanitizedProfile.domain}
- Education: ${sanitizedProfile.educationLevel}
- Experience: ${sanitizedProfile.experienceYears}
- Focus Area: ${sanitizedProfile.focusArea}
- Career Goal: ${sanitizedProfile.careerGoal}
- Learning Style: ${sanitizedProfile.learningStyle}

**RECOMMENDED ROADMAP:**
Priority Skills: ${refinedRecommendation.prioritySkills?.join(', ') || 'Not specified'}
Learning Resources: ${refinedRecommendation.learningResources?.join(', ') || 'Not specified'}
Practice Projects: ${refinedRecommendation.practiceProjects?.join(', ') || 'Not specified'}
Timeline: ${refinedRecommendation.timeline || 'Not specified'}

**USER QUESTION:** "${question}"

**INSTRUCTIONS:**
- Provide a helpful, specific answer based ONLY on the roadmap above
- If the question asks about something not in the roadmap, acknowledge the limitation
- Keep the response concise (2-3 sentences)
- Reference specific elements from the roadmap when possible
- Do not suggest new skills, resources, or timeline changes not already mentioned

**ANSWER:**`;
  }
}

module.exports = LLMRefinementService;