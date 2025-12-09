const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  /**
   * Generate text using Groq API - compatible with HardenedGroqService
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Generation options
   * @returns {Object} - Response with text property
   */
  async generateText(prompt, options = {}) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'user', content: prompt }
        ],
        model: this.model,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: 1,
        stream: false,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('No content received from Groq API');
      }

      return {
        text: responseText,
        usage: completion.usage,
        model: this.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Groq generateText Error:', error);
      throw error;
    }
  }

  /**
   * Refine base recommendation into human-friendly roadmap
   * @param {Object} baseRecommendation - Output from inference engine
   * @param {Array} ruleTrace - Audit trail of fired rules
   * @param {Object} userProfile - User's profile information
   * @param {string} domain - Career domain (e.g., "Web Development")
   * @returns {Object} Refined roadmap with explanation
   */
  async refineRecommendation(baseRecommendation, ruleTrace, userProfile, domain) {
    try {
      const systemPrompt = `You are a career guidance expert specializing in creating personalized learning roadmaps. Your role is to take a rule-based recommendation and refine it into an actionable, human-friendly career roadmap.

CRITICAL INSTRUCTIONS:
1. DO NOT override or contradict the base recommendation logic
2. DO NOT add skills, resources, or timelines not suggested by the rules
3. DO enhance readability, personalization, and actionability
4. DO provide context and motivation for each recommendation
5. DO organize information in a clear, structured format
6. RESPOND ONLY IN ENGLISH LANGUAGE - No other languages allowed

Your output should be professional, encouraging, and practical in English only.`;

      const userPrompt = `
DOMAIN: ${domain}

USER PROFILE:
- Education: ${userProfile.education || 'Not specified'}
- Experience: ${userProfile.experienceYears || 0} years
- Weekly Study Time: ${userProfile.weeklyHours || 10} hours
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}

BASE RECOMMENDATION (from rule engine):
${JSON.stringify(baseRecommendation, null, 2)}

RULE TRACE (why these recommendations were made):
${ruleTrace.map(trace => 
  `- Rule: ${trace.ruleName}\n  Explanation: ${trace.explanation}\n  Actions: ${trace.actions.map(action => action.type).join(', ')}`
).join('\n')}

Please refine this into a comprehensive, personalized learning roadmap as a JSON object with this EXACT structure:

{
  "assessment": {
    "currentLevel": "Beginner/Intermediate/Advanced",
    "strengths": ["strength1", "strength2"],
    "improvementAreas": ["area1", "area2"]
  },
  "weeklyPlan": {
    "week1": {
      "focus": "Core fundamentals",
      "topics": ["topic1", "topic2"],
      "resources": [
        {
          "title": "Resource Title",
          "type": "video/course/book/tutorial",
          "duration": "2 hours",
          "difficulty": "beginner"
        }
      ],
      "project": "Build a simple project",
      "goals": ["goal1", "goal2"]
    },
    "week2": {
      "focus": "Intermediate concepts",
      "topics": ["topic3", "topic4"],
      "resources": [
        {
          "title": "Advanced Resource",
          "type": "course",
          "duration": "3 hours", 
          "difficulty": "intermediate"
        }
      ],
      "project": "Build intermediate project",
      "goals": ["goal3", "goal4"]
    }
  },
  "careerPath": {
    "nextRole": "Target Job Title",
    "salaryRange": "$X,000 - $Y,000",
    "requiredSkills": ["skill1", "skill2", "skill3"]
  },
  "milestones": [
    {
      "week": 1,
      "project": "Project name",
      "skills": ["skill1", "skill2"]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no explanatory text, no markdown formatting, no code blocks.
`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      });

      const refinedContent = completion.choices[0]?.message?.content;
      
      if (!refinedContent) {
        throw new Error('No content received from Groq API');
      }

      // Parse the JSON response
      let parsedRoadmap;
      try {
        // Clean the response of any potential markdown formatting
        const cleanContent = refinedContent.replace(/```json|```/g, '').trim();
        parsedRoadmap = JSON.parse(cleanContent);
        
        console.log('✅ LLM returned valid JSON structure');
        console.log('📊 Keys in response:', Object.keys(parsedRoadmap));
        
      } catch (parseError) {
        console.error('❌ Failed to parse LLM JSON response:', parseError);
        console.log('🔍 Raw response:', refinedContent.substring(0, 500));
        
        // Fallback to generating a basic structure
        parsedRoadmap = this.generateFallbackStructuredRoadmap(baseRecommendation, userProfile, domain);
      }

      return {
        success: true,
        roadmap: parsedRoadmap,
        explanation: this.generateExplanation(ruleTrace),
        refinedTimeline: this.extractTimeline(JSON.stringify(parsedRoadmap)),
        personalizedAdvice: this.extractPersonalizedAdvice(JSON.stringify(parsedRoadmap), userProfile),
        tokensUsed: completion.usage?.total_tokens || 0,
        model: this.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Groq API Error:', error);
      
      // Return fallback response if API fails
      return {
        success: false,
        error: error.message,
        roadmap: this.generateFallbackStructuredRoadmap(baseRecommendation, {}, domain),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate fallback structured roadmap when LLM fails
   */
  generateFallbackStructuredRoadmap(baseRecommendation, userProfile, domain) {
    const experienceLevel = userProfile.experienceLevel || "Beginner";
    
    let skills = ["Problem Solving", "Communication"];
    let focusArea = "General Skills";
    
    if (domain.toLowerCase().includes('web')) {
      skills = ["HTML", "CSS", "JavaScript", "React", "Node.js"];
      focusArea = "Web Development";
    } else if (domain.toLowerCase().includes('data')) {
      skills = ["Python", "SQL", "Data Analysis", "Machine Learning", "Statistics"];
      focusArea = "Data Science";
    } else if (domain.toLowerCase().includes('cyber')) {
      skills = ["Network Security", "Ethical Hacking", "Risk Assessment", "Incident Response"];
      focusArea = "Cybersecurity";
    }

    return {
      assessment: {
        currentLevel: experienceLevel,
        strengths: ["Motivation to Learn", "Goal-oriented Approach"],
        improvementAreas: ["Technical Skills", "Practical Experience", "Industry Knowledge"]
      },
      weeklyPlan: {
        week1: {
          focus: `${focusArea} Fundamentals`,
          topics: skills.slice(0, 2),
          resources: [
            {
              title: `${focusArea} Basics Course`,
              type: "course",
              duration: "3 hours",
              difficulty: "beginner"
            }
          ],
          project: `Build a simple ${focusArea.toLowerCase()} project`,
          goals: [`Learn ${skills[0]}`, `Understand ${skills[1]}`]
        },
        week2: {
          focus: `Intermediate ${focusArea}`,
          topics: skills.slice(2, 4),
          resources: [
            {
              title: `Advanced ${focusArea} Tutorial`,
              type: "tutorial",
              duration: "4 hours",
              difficulty: "intermediate"
            }
          ],
          project: `Build an intermediate ${focusArea.toLowerCase()} project`,
          goals: [`Master ${skills[2]}`, `Apply ${skills[3]}`]
        }
      },
      careerPath: {
        nextRole: `Junior ${focusArea} Developer`,
        salaryRange: "$45,000 - $65,000",
        requiredSkills: skills
      },
      milestones: [
        {
          week: 1,
          project: "First project",
          skills: skills.slice(0, 2)
        },
        {
          week: 2,
          project: "Portfolio project",
          skills: skills.slice(2, 4)
        }
      ]
    };
  }

  /**
   * Generate explanation of rule-based decision process
   */
  generateExplanation(ruleTrace) {
    if (!ruleTrace || ruleTrace.length === 0) {
      return "No rules were applied in generating this recommendation.";
    }

    const firedRules = ruleTrace.filter(trace => trace.fired);
    
    if (firedRules.length === 0) {
      return "No rules matched your profile criteria.";
    }

    let explanation = "This recommendation was generated based on the following logic:\n\n";
    
    firedRules.forEach((trace, index) => {
      explanation += `${index + 1}. **${trace.ruleName}**: ${trace.explanation}\n`;
      if (trace.actions && trace.actions.length > 0) {
        explanation += `   → Actions: ${trace.actions.map(action => action.type).join(', ')}\n`;
      }
      explanation += "\n";
    });

    return explanation;
  }

  /**
   * Extract timeline information from refined content
   */
  extractTimeline(content) {
    const timelineMatch = content.match(/timeline[:\s]*(.*?)(?=\n#|\n\*\*|$)/is);
    if (timelineMatch) {
      return timelineMatch[1].trim();
    }
    return "Timeline information not available";
  }

  /**
   * Extract personalized advice from refined content
   */
  extractPersonalizedAdvice(content, userProfile) {
    const adviceMatch = content.match(/personalized advice[:\s]*(.*?)(?=\n#|\n\*\*|$)/is);
    if (adviceMatch) {
      return adviceMatch[1].trim();
    }
    
    // Generate basic personalized advice if not found
    return `Based on your ${userProfile.education} education and ${userProfile.experienceYears} years of experience, focus on consistent progress with ${userProfile.weeklyHours} hours per week.`;
  }

  /**
   * Generate fallback roadmap if API fails
   */
  generateFallbackRoadmap(baseRecommendation) {
    let fallback = "# Your Learning Roadmap\n\n";
    
    if (baseRecommendation.skills && baseRecommendation.skills.length > 0) {
      fallback += "## Recommended Skills\n";
      baseRecommendation.skills.forEach((skill, index) => {
        fallback += `${index + 1}. ${skill}\n`;
      });
      fallback += "\n";
    }

    if (baseRecommendation.resources && baseRecommendation.resources.length > 0) {
      fallback += "## Learning Resources\n";
      baseRecommendation.resources.forEach((resource, index) => {
        fallback += `${index + 1}. ${resource}\n`;
      });
      fallback += "\n";
    }

    if (baseRecommendation.projects && baseRecommendation.projects.length > 0) {
      fallback += "## Practice Projects\n";
      baseRecommendation.projects.forEach((project, index) => {
        fallback += `${index + 1}. ${project}\n`;
      });
      fallback += "\n";
    }

    if (baseRecommendation.timeline) {
      fallback += `## Timeline\n${baseRecommendation.timeline}\n\n`;
    }

    fallback += "*This is a basic roadmap. For enhanced personalization, please try again when the AI service is available.*";
    
    return fallback;
  }

  /**
   * Test connection to Groq API
   */
  async testConnection() {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello, respond with "Connection successful"' }],
        model: this.model,
        max_tokens: 10,
        temperature: 0,
      });

      return {
        success: true,
        response: completion.choices[0]?.message?.content,
        model: this.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GroqService;