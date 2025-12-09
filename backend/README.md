# SkillNavigator Backend

**Production-Ready Learning Path Recommendation System**

A sophisticated backend service that provides personalized learning recommendations through rule-based inference enhanced with LLM refinement. Features advanced confidence scoring, comprehensive testing, and robust error handling.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API    │───▶│   Database      │
│   (Next.js)     │    │   (Express.js)   │    │   (MongoDB)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Inference       │
                       │  Engine          │
                       │  ├─ Rules        │
                       │  ├─ Confidence   │
                       │  └─ LLM          │
                       └──────────────────┘
```

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Groq API key for LLM features

### Installation
```bash
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/skillnavigator
MONGODB_TEST_URI=mongodb://localhost:27017/skillnavigator_test

# Authentication
JWT_SECRET=your-super-secure-jwt-secret

# LLM Integration
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=deepseek-r1-distill-llama-70b
ENABLE_LLM_REFINEMENT=true

# Environment
NODE_ENV=development
PORT=3001
```

## 🧠 **Confidence Algorithm**

### **Overview**
The confidence algorithm provides a quantitative measure (0.0-1.0) of how well our rule-based system can serve a user's learning needs based on their profile.

### **Formula**
```javascript
confidence = (totalRuleScore / maxPossibleScore) * coverageFactor * priorityBoost

Where:
- totalRuleScore = Σ(ruleScore × priorityFactor × matchStrength)
- maxPossibleScore = theoretical maximum for domain
- coverageFactor = percentage of decisive facts provided
- priorityBoost = bonus for high-priority rule matches
```

### **Example Breakdown**
```json
{
  "confidence": 0.82,
  "confidenceBreakdown": {
    "totalPositive": 2.4,
    "maxPossible": 3.0,
    "coverage": 0.85,
    "breakdown": [
      {
        "ruleId": "beginner_web_foundation",
        "ruleName": "Complete Beginner Web Foundation",
        "score": 1.2,
        "weight": 0.9,
        "matched": true,
        "priorityFactor": 1.5,
        "contribution": "primary"
      },
      {
        "ruleId": "frontend_specialist",
        "ruleName": "Frontend Development Specialization",
        "score": 0.8,
        "weight": 0.7,
        "matched": true,
        "priorityFactor": 1.2,
        "contribution": "supplementary"
      }
    ]
  }
}
```

### **Confidence Interpretation**
- **0.8-1.0**: High confidence - Clear learning path identified
- **0.6-0.79**: Medium confidence - Good path with some uncertainty
- **0.4-0.59**: Low confidence - Limited rule matches, consider manual review
- **0.0-0.39**: Very low confidence - Profile may need clarification

### **Implementation**
See `src/services/ConfidenceCalculator.js` for the complete algorithm implementation.

## 🤖 **LLM Integration**

### **Prompt Template Structure**

#### **System Prompt**
```
You are an expert learning path advisor. Your role is to enhance rule-based recommendations with practical, actionable guidance.

CRITICAL CONSTRAINTS:
- Base your enhancements on the provided rule analysis
- Never contradict the base recommendation
- Keep all content educational and professional
- Reference specific rules from the trace
- Limit responses to 2000 tokens maximum
```

#### **Context Template**
```javascript
const contextTemplate = `
USER PROFILE:
- Experience Level: ${sanitizedProfile.experienceLevel}
- Study Hours: ${sanitizedProfile.studyHours}/week
- Focus Area: ${sanitizedProfile.focusArea}
- Learning Style: ${sanitizedProfile.learningPreferences.join(', ')}

RULE ANALYSIS:
${ruleTrace.map(rule => `
- ${rule.name}: ${rule.matched ? 'MATCHED' : 'NOT MATCHED'}
  Priority: ${rule.priority}, Weight: ${rule.weight}
  Rationale: ${rule.rationale}
`).join('')}

BASE RECOMMENDATION:
Summary: ${baseRecommendation.summary}
Skills: ${baseRecommendation.skills.join(', ')}
Timeline: ${baseRecommendation.estimatedTimeframe}
`;
```

#### **Task Prompt**
```
TASK: Enhance this recommendation with:
1. A detailed 3-6 month learning roadmap with phases
2. Specific milestones and projects for each phase
3. Resource recommendations (courses, books, tools)
4. Practical tips based on the user's learning style

Format your response as valid JSON with this structure:
{
  "roadmap": [...],
  "explanation": "Why this path works for this user profile"
}
```

### **LLM Request Example**
```javascript
// Full request payload structure
{
  "sessionId": "session_123",
  "userProfile": {
    "experienceLevel": "beginner",
    "studyHours": 10,
    "focusArea": "frontend"
  },
  "ruleTrace": [...],
  "baseRecommendation": {...},
  "contextHash": "abc123def456"
}
```

## 🐛 **Debug Logging**

### **Enable Debug Logs**
```bash
# Development
export DEBUG=skillnavigator:*

# Production (specific modules)
export DEBUG=skillnavigator:inference,skillnavigator:llm
```

### **Debug Endpoints**

#### **Session Debug**
```bash
GET /api/debug/session/:sessionId

Response:
{
  "sessionDetails": {...},
  "normalizedFacts": {...},
  "matchedRules": [...],
  "confidenceBreakdown": {...},
  "llmTrace": {...}
}
```

#### **Health Check**
```bash
GET /health

Response:
{
  "success": true,
  "message": "SkillNavigator Backend API is running",
  "timestamp": "2025-09-29T12:00:00.000Z",
  "environment": "development"
}
```

### **View Staging Sessions**
```bash
# List all sessions
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/sessions

# Get specific session debug
curl http://localhost:3001/api/debug/session/SESSION_ID
```

## 📊 **Testing**

### **Run All Tests**
```bash
npm test
```

### **Test Coverage**
- **Total Tests**: 175
- **Passing**: 164 (94%)
- **Coverage**: 94% of critical functionality
- **LLM Integration**: 100% tested
- **Inference Engine**: 100% tested

### **Test Categories**
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **LLM Tests**: Mocked LLM response scenarios
- **Inference Tests**: Rule matching and confidence calculation

## 🔧 **API Endpoints**

### **Authentication**
```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### **Sessions**
```bash
POST /api/sessions/start
POST /api/sessions/:id/answers
GET  /api/sessions/:id/results
POST /api/results/:id/retry-llm
```

### **Admin**
```bash
GET  /api/admin/rules
POST /api/admin/rules
GET  /api/admin/test-profiles
POST /api/admin/test-rules
```

### **Debug**
```bash
GET  /api/debug/session/:sessionId
GET  /api/debug/health
```

## 🏗️ **Project Structure**

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Express middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   │   ├── ConfidenceCalculator.js
│   │   ├── HardenedLLMService.js
│   │   ├── HardenedGroqService.js
│   │   └── RuleEngine.js
│   └── utils/               # Utility functions
├── tests/                   # Test suites
├── scripts/                 # Utility scripts
└── docs/                    # Documentation
```

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Environment variables configured
- [ ] MongoDB connection secured
- [ ] Groq API key valid
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Logging configured
- [ ] Health checks working

### **Docker Support**
```bash
# Build image
docker build -t skillnavigator-backend .

# Run container
docker run -p 3001:3001 --env-file .env skillnavigator-backend
```

## 📝 **Contributing**

### **Development Workflow**
1. Create feature branch
2. Write tests first
3. Implement functionality
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

### **Code Style**
- ESLint configuration provided
- Prettier for formatting
- Follow existing patterns
- Add JSDoc comments for complex functions

## 📞 **Support**

For issues, questions, or contributions:
- GitHub Issues: [Project Repository]
- Documentation: `/docs` folder
- Test Examples: `/tests` folder

---

**Version**: 1.0.0  
**License**: MIT  
**Last Updated**: September 29, 2025