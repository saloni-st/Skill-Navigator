require('dotenv').config();

class AssessmentGenerationService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.model = process.env.GROQ_MODEL || "deepseek-r1-distill-llama-70b";
        this.maxTokens = parseInt(process.env.GROQ_MAX_TOKENS) || 8000;
        this.temperature = parseFloat(process.env.GROQ_TEMPERATURE) || 0.7;
        
        // Configurable question count settings
        this.defaultQuestionCount = parseInt(process.env.DEFAULT_QUESTION_COUNT) || 15;
        this.minQuestionCount = parseInt(process.env.MIN_QUESTION_COUNT) || 10;
        this.maxQuestionCount = parseInt(process.env.MAX_QUESTION_COUNT) || 30;
    }

    async generateAssessmentQuestions(domainName, domainDescription, questionCount = null) {
        // Use configured default if not specified
        const targetCount = questionCount || this.defaultQuestionCount;
        
        // Validate question count within limits
        const validatedCount = Math.min(Math.max(targetCount, this.minQuestionCount), this.maxQuestionCount);
        
        if (validatedCount !== targetCount) {
            console.log(`⚠️ Question count adjusted: ${targetCount} → ${validatedCount} (within limits ${this.minQuestionCount}-${this.maxQuestionCount})`);
        }
        
        console.log(`🧠 Generating ${validatedCount} assessment questions for domain: ${domainName}`);
        
        try {
            const prompt = this.buildAssessmentPrompt(domainName, domainDescription, validatedCount);
            const llmResponse = await this.callLLMAPI(prompt);
            const questions = this.parseQuestions(llmResponse, domainName);
            
            // Ensure we have enough questions
            if (questions.length < validatedCount) {
                console.log(`⚠️ LLM returned ${questions.length} questions, padding with domain-specific questions to reach ${validatedCount}`);
                const fallbackQuestions = this.getFallbackQuestions(domainName);
                const additionalQuestions = fallbackQuestions.slice(0, validatedCount - questions.length);
                questions.push(...additionalQuestions);
            }
            
            console.log(`✅ Generated ${questions.length} questions for ${domainName}`);
            return {
                success: true,
                questions: questions.slice(0, validatedCount), // Ensure exact count
                domainName,
                questionCount: questions.length,
                requestedCount: targetCount,
                adjustedCount: validatedCount
            };
        } catch (error) {
            console.error('❌ Error generating assessment questions:', error);
            console.log('🔄 Falling back to domain-specific questions');
            return {
                success: true, // Still return success with fallback
                questions: this.getFallbackQuestions(domainName),
                domainName,
                questionCount: this.getFallbackQuestions(domainName).length,
                requestedCount: targetCount,
                usedFallback: true
            };
        }
    }

    buildAssessmentPrompt(domainName, domainDescription, questionCount) {
        return `You are an expert assessment designer. Generate exactly ${questionCount} assessment questions for ${domainName}.

DOMAIN: ${domainName}
DESCRIPTION: ${domainDescription}

CRITICAL: Return ONLY valid JSON in this exact format. No extra text, no markdown, no explanations.

{
  "questions": [
    {
      "questionId": "devops_experience",
      "key": "devops_experience", 
      "question": "What is your experience level with DevOps practices?",
      "text": "What is your experience level with DevOps practices?",
      "type": "single_choice",
      "difficulty": "beginner",
      "category": "Experience",
      "options": [
        {"value": "beginner", "label": "Just starting out (0-1 years)"},
        {"value": "intermediate", "label": "Some experience (1-3 years)"},
        {"value": "advanced", "label": "Experienced (3-5 years)"},
        {"value": "expert", "label": "Expert level (5+ years)"}
      ],
      "order": 1,
      "required": true
    }
  ]
}

REQUIREMENTS:
- Generate exactly ${questionCount} questions
- Each question must have: questionId, key, question, text, type, difficulty, category, options, order, required
- Types: "single_choice", "multiple_choice", "scale", "text"
- Difficulties: "beginner", "intermediate", "advanced"
- Include practical ${domainName} scenarios
- Make questionId and key unique and descriptive
- Ensure all JSON is valid and properly formatted

Return ONLY the JSON object:`;
    }

    async callLLMAPI(prompt) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional assessment designer. Always return valid JSON only. No markdown, no explanations, just pure JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: 0.3 // Lower temperature for more consistent JSON
                })
            });

            if (!response.ok) {
                throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '';
            console.log('🔍 LLM Raw Response Length:', content.length);
            console.log('🔍 LLM Raw Response Sample:', content.substring(0, 200) + '...');
            return content;
        } catch (error) {
            console.error('❌ LLM API call failed:', error);
            throw error;
        }
    }

    parseQuestions(llmResponse, domainName = 'Unknown') {
        try {
            console.log('🔍 Raw LLM Response:', llmResponse.substring(0, 500) + '...');
            
            // Multiple strategies to extract JSON
            let parsed = null;
            
            // Strategy 1: Direct JSON parse
            try {
                parsed = JSON.parse(llmResponse);
                console.log('✅ Direct JSON parse successful');
            } catch (e) {
                console.log('⚠️ Direct JSON parse failed, trying extraction...');
            }
            
            // Strategy 2: Extract JSON from markdown code blocks
            if (!parsed) {
                const codeBlockMatch = llmResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
                if (codeBlockMatch) {
                    try {
                        parsed = JSON.parse(codeBlockMatch[1]);
                        console.log('✅ Code block JSON extraction successful');
                    } catch (e) {
                        console.log('⚠️ Code block JSON parse failed');
                    }
                }
            }
            
            // Strategy 3: Find any JSON object in response
            if (!parsed) {
                const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        parsed = JSON.parse(jsonMatch[0]);
                        console.log('✅ JSON extraction successful');
                    } catch (e) {
                        console.log('⚠️ JSON extraction parse failed');
                    }
                }
            }
            
            // Strategy 4: Look for questions array specifically
            if (!parsed) {
                const questionsMatch = llmResponse.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
                if (questionsMatch) {
                    try {
                        parsed = JSON.parse(`{"questions":[${questionsMatch[1]}]}`);
                        console.log('✅ Questions array extraction successful');
                    } catch (e) {
                        console.log('⚠️ Questions array parse failed');
                    }
                }
            }
            
            if (!parsed) {
                console.error('❌ All parsing strategies failed');
                throw new Error('No valid JSON found in LLM response');
            }

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                console.error('❌ Invalid questions format:', parsed);
                throw new Error('Invalid questions format - missing questions array');
            }

            console.log(`✅ Successfully parsed ${parsed.questions.length} questions`);

            // Validate and enhance questions
            return parsed.questions.map((q, index) => ({
                questionId: q.questionId || q.key || `q${index + 1}`,
                key: q.key || q.questionId || `q${index + 1}`,
                question: q.question || q.text || '',
                text: q.question || q.text || '',
                type: q.type || 'single_choice',
                difficulty: q.difficulty || 'intermediate',
                category: q.category || 'General',
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                order: q.order || index + 1,
                required: q.required !== false
            }));
        } catch (error) {
            console.error('❌ Error parsing questions:', error);
            console.error('❌ LLM Response sample:', llmResponse.substring(0, 1000));
            
            // Return fallback questions instead of throwing
            return this.getFallbackQuestions(domainName);
        }
    }

    getFallbackQuestions(domainName) {
        console.log(`🔄 Using fallback questions for domain: ${domainName}`);
        
        // DevOps specific fallback questions
        if (domainName.toLowerCase().includes('devops')) {
            return [
                {
                    questionId: 'devops_experience',
                    key: 'devops_experience',
                    question: 'What is your experience level with DevOps practices?',
                    text: 'What is your experience level with DevOps practices?',
                    type: 'single_choice',
                    difficulty: 'beginner',
                    category: 'Experience',
                    options: [
                        { value: 'beginner', label: 'Just starting out (0-1 years)' },
                        { value: 'intermediate', label: 'Some experience (1-3 years)' },
                        { value: 'advanced', label: 'Experienced (3-5 years)' },
                        { value: 'expert', label: 'Expert level (5+ years)' }
                    ],
                    order: 1,
                    required: true
                },
                {
                    questionId: 'cicd_tools',
                    key: 'cicd_tools',
                    question: 'Which CI/CD tools have you worked with?',
                    text: 'Which CI/CD tools have you worked with?',
                    type: 'multiple_choice',
                    difficulty: 'intermediate',
                    category: 'Tools',
                    options: [
                        { value: 'jenkins', label: 'Jenkins' },
                        { value: 'gitlab_ci', label: 'GitLab CI/CD' },
                        { value: 'github_actions', label: 'GitHub Actions' },
                        { value: 'azure_devops', label: 'Azure DevOps' },
                        { value: 'circle_ci', label: 'CircleCI' },
                        { value: 'none', label: 'None yet' }
                    ],
                    order: 2,
                    required: true
                },
                {
                    questionId: 'container_knowledge',
                    key: 'container_knowledge',
                    question: 'How familiar are you with containerization technologies?',
                    text: 'How familiar are you with containerization technologies?',
                    type: 'single_choice',
                    difficulty: 'intermediate',
                    category: 'Containerization',
                    options: [
                        { value: 'none', label: 'No experience' },
                        { value: 'basic_docker', label: 'Basic Docker knowledge' },
                        { value: 'docker_compose', label: 'Docker & Docker Compose' },
                        { value: 'kubernetes', label: 'Docker + Kubernetes' },
                        { value: 'advanced', label: 'Advanced orchestration' }
                    ],
                    order: 3,
                    required: true
                },
                {
                    questionId: 'cloud_platform',
                    key: 'cloud_platform',
                    question: 'Which cloud platforms do you have experience with?',
                    text: 'Which cloud platforms do you have experience with?',
                    type: 'multiple_choice',
                    difficulty: 'intermediate',
                    category: 'Cloud',
                    options: [
                        { value: 'aws', label: 'Amazon Web Services (AWS)' },
                        { value: 'azure', label: 'Microsoft Azure' },
                        { value: 'gcp', label: 'Google Cloud Platform' },
                        { value: 'digital_ocean', label: 'DigitalOcean' },
                        { value: 'other', label: 'Other cloud providers' },
                        { value: 'none', label: 'No cloud experience' }
                    ],
                    order: 4,
                    required: true
                },
                {
                    questionId: 'iac_tools',
                    key: 'iac_tools',
                    question: 'Have you used Infrastructure as Code (IaC) tools?',
                    text: 'Have you used Infrastructure as Code (IaC) tools?',
                    type: 'multiple_choice',
                    difficulty: 'advanced',
                    category: 'Infrastructure',
                    options: [
                        { value: 'terraform', label: 'Terraform' },
                        { value: 'ansible', label: 'Ansible' },
                        { value: 'cloudformation', label: 'AWS CloudFormation' },
                        { value: 'pulumi', label: 'Pulumi' },
                        { value: 'helm', label: 'Helm (Kubernetes)' },
                        { value: 'none', label: 'No IaC experience' }
                    ],
                    order: 5,
                    required: true
                },
                {
                    questionId: 'monitoring_tools',
                    key: 'monitoring_tools',
                    question: 'What monitoring and logging tools are you familiar with?',
                    text: 'What monitoring and logging tools are you familiar with?',
                    type: 'multiple_choice',
                    difficulty: 'intermediate',
                    category: 'Monitoring',
                    options: [
                        { value: 'prometheus', label: 'Prometheus' },
                        { value: 'grafana', label: 'Grafana' },
                        { value: 'elk_stack', label: 'ELK Stack (Elasticsearch, Logstash, Kibana)' },
                        { value: 'datadog', label: 'Datadog' },
                        { value: 'new_relic', label: 'New Relic' },
                        { value: 'none', label: 'No monitoring experience' }
                    ],
                    order: 6,
                    required: true
                }
            ];
        }
        
        // Fallback questions based on domain
        const fallbackQuestions = {
            'Web Development': [
                {
                    questionId: 'q1',
                    question: 'What is your experience level with HTML and CSS?',
                    type: 'scale',
                    difficulty: 'beginner',
                    category: 'Frontend Basics',
                    options: [
                        { value: '1', label: 'No experience' },
                        { value: '2', label: 'Basic knowledge' },
                        { value: '3', label: 'Intermediate' },
                        { value: '4', label: 'Advanced' },
                        { value: '5', label: 'Expert level' }
                    ],
                    order: 1
                }
            ],
            'Cybersecurity': [
                {
                    questionId: 'q1',
                    question: 'How familiar are you with network security concepts?',
                    type: 'scale',
                    difficulty: 'beginner',
                    category: 'Network Security',
                    options: [
                        { value: '1', label: 'No experience' },
                        { value: '2', label: 'Basic understanding' },
                        { value: '3', label: 'Intermediate knowledge' },
                        { value: '4', label: 'Advanced understanding' },
                        { value: '5', label: 'Expert level' }
                    ],
                    order: 1
                }
            ]
        };

        return fallbackQuestions[domainName] || fallbackQuestions['Web Development'];
    }

    async enhanceExistingQuestions(existingQuestions, domainName, domainDescription, targetCount = null) {
        // Use configured default if not specified
        const finalTargetCount = targetCount || this.defaultQuestionCount;
        
        const currentCount = existingQuestions.length;
        const needed = Math.max(0, finalTargetCount - currentCount);
        
        if (needed === 0) {
            console.log(`✅ Domain ${domainName} already has sufficient questions (${currentCount}/${finalTargetCount})`);
            return existingQuestions;
        }

        console.log(`🔄 Enhancing ${domainName}: Adding ${needed} questions to existing ${currentCount} (target: ${finalTargetCount})`);
        
        const newQuestions = await this.generateAssessmentQuestions(domainName, domainDescription, needed);
        
        if (newQuestions.success) {
            // Adjust order for new questions
            const enhancedQuestions = newQuestions.questions.map((q, index) => ({
                ...q,
                order: currentCount + index + 1
            }));
            
            return [...existingQuestions, ...enhancedQuestions];
        }
        
        return existingQuestions;
    }
}

module.exports = AssessmentGenerationService;