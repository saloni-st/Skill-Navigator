# Test Plan - SkillNavigator

**Comprehensive testing documentation for quality assurance and regression testing**

## 🎯 **Testing Overview**

This document provides detailed test profiles, expected outcomes, and testing procedures for the SkillNavigator learning recommendation system. All tests can be executed in staging environment for validation.

## 👤 **Test Profiles**

### **Profile 1: Complete Beginner - Casual Learner**

#### **User Persona**: Sarah the Newcomer
- **Demographics**: College student, no coding experience
- **Goals**: Personal interest, casual learning pace
- **Constraints**: Limited time (5 hours/week)

#### **Test Input**
```json
{
  "education_level": "bachelors",
  "coding_experience": "0",
  "weekly_hours": "5", 
  "web_dev_focus": "frontend",
  "career_goal": "personal_projects",
  "learning_style": ["video_courses"],
  "timeframe": "flexible",
  "previous_languages": []
}
```

#### **Expected Normalized Facts**
```json
{
  "experienceLevel": "absolute_beginner",
  "experienceYears": 0,
  "studyHours": 5,
  "commitmentLevel": "casual",
  "focusArea": "frontend",
  "careerPath": "frontend_specialist", 
  "careerGoal": "hobby",
  "urgency": "low",
  "learningPreferences": ["visual"],
  "resourceTypes": ["video"]
}
```

#### **Expected Base Recommendation**
```json
{
  "summary": "Start with HTML/CSS fundamentals, then basic JavaScript. Focus on visual learning resources and build simple projects at your own pace.",
  "skills": [
    "HTML5 Semantics",
    "CSS Fundamentals", 
    "Basic JavaScript",
    "Responsive Design Basics"
  ],
  "estimatedTimeframe": "20-24 weeks",
  "difficulty": "beginner",
  "recommendedPath": [
    "HTML/CSS Foundations",
    "JavaScript Basics",
    "First Portfolio Project",
    "Responsive Design",
    "Interactive Elements"
  ],
  "resources": [
    "MDN Web Docs",
    "freeCodeCamp", 
    "YouTube tutorials",
    "Codecademy"
  ]
}
```

#### **Expected Confidence**
- **Range**: 0.75 - 0.85
- **Rationale**: Clear beginner path with good rule matches for casual learner profile

#### **Expected Rules Fired**
1. **Complete Beginner Web Foundation** (Priority: 10, Weight: 0.9)
2. **Part-Time Learning Journey** (Priority: 7, Weight: 0.7)
3. **Visual Learning Optimized** (Priority: 5, Weight: 0.6)

---

### **Profile 2: Career Switcher - Intensive**

#### **User Persona**: Mike the Career Changer
- **Demographics**: Master's degree holder, 1 year coding experience
- **Goals**: Career change to software development
- **Constraints**: High availability (40 hours/week)

#### **Test Input**
```json
{
  "education_level": "masters",
  "coding_experience": "1",
  "weekly_hours": "40",
  "web_dev_focus": "fullstack", 
  "career_goal": "job_switch",
  "learning_style": ["structured_course", "hands_on"],
  "timeframe": "6_months",
  "previous_languages": ["python"]
}
```

#### **Expected Normalized Facts**
```json
{
  "experienceLevel": "beginner",
  "experienceYears": 1,
  "studyHours": 40,
  "commitmentLevel": "intensive",
  "focusArea": "fullstack",
  "careerPath": "fullstack_developer",
  "careerGoal": "employment", 
  "urgency": "high",
  "learningPreferences": ["structured", "kinesthetic"],
  "resourceTypes": ["course", "project"]
}
```

#### **Expected Base Recommendation**
```json
{
  "summary": "Intensive full-stack bootcamp-style curriculum focusing on job-ready skills. Leverage your existing Python knowledge while building web development expertise.",
  "skills": [
    "Advanced JavaScript/ES6+",
    "React.js Framework",
    "Node.js & Express",
    "Database Design (SQL/NoSQL)",
    "API Development",
    "Testing & Deployment"
  ],
  "estimatedTimeframe": "20-24 weeks intensive",
  "difficulty": "intermediate",
  "recommendedPath": [
    "JavaScript Mastery",
    "Frontend Framework (React)",
    "Backend Development (Node.js)",
    "Database Integration", 
    "Full-Stack Projects",
    "Job Preparation"
  ]
}
```

#### **Expected Confidence**
- **Range**: 0.85 - 0.95
- **Rationale**: High commitment, clear goals, and multiple rule matches

#### **Expected Rules Fired**
1. **Full-Stack Developer Journey** (Priority: 9, Weight: 0.9)
2. **Intensive Learning Track** (Priority: 8, Weight: 0.8)
3. **Career Switcher Focus** (Priority: 8, Weight: 0.8)
4. **Structured Learning Path** (Priority: 6, Weight: 0.6)

---

### **Profile 3: Experienced Developer - Backend Focus**

#### **User Persona**: Alex the Backend Specialist
- **Demographics**: 5 years coding experience, wants to specialize
- **Goals**: Skill enhancement in web backend technologies
- **Constraints**: Moderate time (15 hours/week)

#### **Test Input**
```json
{
  "education_level": "bachelors",
  "coding_experience": "5",
  "weekly_hours": "15",
  "web_dev_focus": "backend",
  "career_goal": "skill_upgrade", 
  "learning_style": ["hands_on", "documentation"],
  "timeframe": "3_months",
  "previous_languages": ["java", "python", "sql"]
}
```

#### **Expected Normalized Facts**
```json
{
  "experienceLevel": "intermediate",
  "experienceYears": 5,
  "studyHours": 15,
  "commitmentLevel": "moderate",
  "focusArea": "backend",
  "careerPath": "backend_specialist",
  "careerGoal": "upskilling",
  "urgency": "medium", 
  "learningPreferences": ["kinesthetic", "reading"],
  "resourceTypes": ["documentation", "project"]
}
```

#### **Expected Base Recommendation**
```json
{
  "summary": "Advanced backend specialization focusing on modern web technologies and best practices. Build on your existing programming foundation.",
  "skills": [
    "Advanced Node.js/Express",
    "Microservices Architecture", 
    "API Design & GraphQL",
    "Cloud Services (AWS/Azure)",
    "Performance Optimization",
    "Security Best Practices"
  ],
  "estimatedTimeframe": "12-16 weeks",
  "difficulty": "advanced",
  "recommendedPath": [
    "Node.js Advanced Concepts",
    "API Architecture",
    "Database Optimization",
    "Cloud Deployment",
    "Advanced Projects"
  ]
}
```

#### **Expected Confidence**
- **Range**: 0.80 - 0.90
- **Rationale**: Strong technical background with clear specialization path

#### **Expected Rules Fired**
1. **Backend Development Specialization** (Priority: 9, Weight: 0.9)
2. **Experienced Developer Path** (Priority: 7, Weight: 0.8)  
3. **Hands-On Learning Focus** (Priority: 6, Weight: 0.7)

---

### **Profile 4: Advanced Developer - High Commitment**

#### **User Persona**: Jordan the Expert
- **Demographics**: 3 years experience, seeking advanced frontend skills
- **Goals**: Freelancing preparation with cutting-edge technologies
- **Constraints**: High availability (25 hours/week)

#### **Test Input**
```json
{
  "education_level": "masters",
  "coding_experience": "3",
  "weekly_hours": "25",
  "web_dev_focus": "frontend",
  "career_goal": "freelancing",
  "learning_style": ["hands_on", "mentorship"],
  "timeframe": "4_months", 
  "previous_languages": ["javascript", "python", "css"]
}
```

#### **Expected Confidence**
- **Range**: 0.85 - 0.95
- **Rationale**: Advanced profile with clear goals and high commitment

#### **Expected Rules Fired**
1. **Freelance Developer Toolkit** (Priority: 8, Weight: 0.8)
2. **Advanced Frontend Mastery** (Priority: 8, Weight: 0.9)
3. **High Commitment Track** (Priority: 7, Weight: 0.7)

---

### **Profile 5: Self-Taught Explorer**

#### **User Persona**: Casey the Explorer
- **Demographics**: High school education, self-directed learner
- **Goals**: Exploration and skill building 
- **Constraints**: Moderate time, prefers community learning

#### **Test Input**
```json
{
  "education_level": "high_school",
  "coding_experience": "2", 
  "weekly_hours": "12",
  "web_dev_focus": "fullstack",
  "career_goal": "skill_upgrade",
  "learning_style": ["self_paced", "community"],
  "timeframe": "flexible"
}
```

#### **Expected Confidence**
- **Range**: 0.65 - 0.80
- **Rationale**: Self-directed learning with community focus, moderate confidence due to flexible goals

#### **Expected Rules Fired**
1. **Self-Paced Learning Journey** (Priority: 6, Weight: 0.7)
2. **Community Learning Focus** (Priority: 5, Weight: 0.6)
3. **Full-Stack Exploration** (Priority: 7, Weight: 0.8)

---

### **Profile 6: Part-Time Student**

#### **User Persona**: Riley the Student
- **Demographics**: Some college, complete beginner
- **Goals**: Exploration while studying
- **Constraints**: Very limited time (8 hours/week)

#### **Test Input**
```json
{
  "education_level": "some_college",
  "coding_experience": "0",
  "weekly_hours": "8",
  "web_dev_focus": "unsure",
  "career_goal": "exploration", 
  "learning_style": ["video_courses", "interactive"]
}
```

#### **Expected Confidence**
- **Range**: 0.60 - 0.80
- **Rationale**: Beginner-friendly path but lower due to uncertain focus

#### **Expected Rules Fired**
1. **Complete Beginner Web Foundation** (Priority: 10, Weight: 0.9)
2. **Part-Time Learning Journey** (Priority: 7, Weight: 0.7)
3. **Exploration Track** (Priority: 4, Weight: 0.5)

---

### **Profile 7: Bootcamp Graduate - Job Ready**

#### **User Persona**: Sam the Bootcamp Graduate  
- **Demographics**: Bootcamp education, ready for employment
- **Goals**: Job search and skill reinforcement
- **Constraints**: High intensity (35 hours/week)

#### **Test Input**
```json
{
  "education_level": "bootcamp",
  "coding_experience": "1",
  "weekly_hours": "35",
  "web_dev_focus": "fullstack",
  "career_goal": "job_switch",
  "learning_style": ["hands_on", "structured_course"]
}
```

#### **Expected Confidence**
- **Range**: 0.85 - 0.95
- **Rationale**: Job-focused with intensive commitment and structured background

#### **Expected Rules Fired**
1. **Job-Ready Developer Track** (Priority: 9, Weight: 0.9)
2. **Full-Stack Developer Journey** (Priority: 9, Weight: 0.9)
3. **Intensive Learning Track** (Priority: 8, Weight: 0.8)

---

### **Profile 8: Visual Learner - Frontend**

#### **User Persona**: Morgan the Visual Learner
- **Demographics**: Associates degree, visual learning preference
- **Goals**: Frontend development for freelancing
- **Constraints**: Moderate time with specific learning needs

#### **Test Input**
```json
{
  "education_level": "associates", 
  "coding_experience": "2",
  "weekly_hours": "18",
  "web_dev_focus": "frontend", 
  "career_goal": "freelancing",
  "learning_style": ["visual", "interactive"]
}
```

#### **Expected Confidence**
- **Range**: 0.75 - 0.90
- **Rationale**: Clear path with visual learning optimization

#### **Expected Rules Fired**
1. **Visual Learning Optimized** (Priority: 6, Weight: 0.8)
2. **Freelance Developer Toolkit** (Priority: 8, Weight: 0.8)
3. **Frontend Specialist Path** (Priority: 7, Weight: 0.7)

## 🧪 **Test Execution Procedures**

### **Manual Testing Steps**

#### **1. Profile Registration & Authentication**
```bash
# Register test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.profile1@example.com", 
    "password": "TestPass123!"
  }'

# Extract JWT token for subsequent requests
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test.profile1@example.com", "password": "TestPass123!"}' \
  | jq -r '.data.token')
```

#### **2. Session Creation**
```bash
# Start assessment session
SESSION_RESPONSE=$(curl -X POST http://localhost:3001/api/sessions/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domainId": "DOMAIN_ID"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.sessionId')
```

#### **3. Submit Answers**
```bash
# Submit profile answers (using Profile 1 as example)
curl -X POST http://localhost:3001/api/sessions/$SESSION_ID/answers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "education_level": "bachelors",
      "coding_experience": "0", 
      "weekly_hours": "5",
      "web_dev_focus": "frontend",
      "career_goal": "personal_projects",
      "learning_style": ["video_courses"]
    }
  }'
```

#### **4. Get Results & Validate**
```bash
# Get recommendations
RESULTS=$(curl -X GET http://localhost:3001/api/sessions/$SESSION_ID/results \
  -H "Authorization: Bearer $TOKEN")

# Extract confidence score
CONFIDENCE=$(echo $RESULTS | jq -r '.data.confidence')

# Validate confidence is in expected range (0.75-0.85 for Profile 1)
if (( $(echo "$CONFIDENCE >= 0.75 && $CONFIDENCE <= 0.85" | bc -l) )); then
  echo "✅ Confidence validation passed: $CONFIDENCE"
else
  echo "❌ Confidence validation failed: $CONFIDENCE (expected 0.75-0.85)"
fi
```

#### **5. Debug Session Analysis**
```bash
# Get detailed session debug info
curl -X GET http://localhost:3001/api/debug/session/$SESSION_ID | jq .
```

### **Automated Test Suite**

#### **Run Full Test Suite**
```bash
cd backend
npm test
```

#### **Run Specific Test Categories**
```bash
# Inference engine tests
npm test -- --testNamePattern="Inference Engine"

# Confidence calculation tests  
npm test -- --testNamePattern="Confidence"

# LLM integration tests
npm test -- --testNamePattern="LLM Integration"

# API integration tests
npm test -- --testNamePattern="API Integration"
```

### **Test Data Validation**

#### **Expected Test Coverage**
- **Total Tests**: 175+
- **Passing Rate**: >94%
- **Core Components**: 100% coverage
  - Inference Engine
  - Confidence Calculator
  - LLM Integration
  - Rule Matching

#### **Performance Benchmarks**
- **API Response Time**: <500ms average
- **Database Query Time**: <100ms average  
- **LLM Processing Time**: <5s with timeout
- **Memory Usage**: <512MB under normal load

### **Regression Testing Checklist**

#### **After Rule Changes**
- [ ] Run all 8 test profiles
- [ ] Validate confidence scores within expected ranges
- [ ] Check for unexpected rule firing patterns
- [ ] Verify recommendation quality

#### **After LLM Changes**  
- [ ] Test LLM success scenarios
- [ ] Test LLM failure/timeout scenarios
- [ ] Validate fallback behavior
- [ ] Check response formatting

#### **After API Changes**
- [ ] Run full API integration test suite
- [ ] Test authentication flows
- [ ] Validate error handling
- [ ] Check rate limiting

## 📊 **Test Results Tracking**

### **Test Results Template**
```json
{
  "testRun": {
    "id": "test_run_20250929_001",
    "timestamp": "2025-09-29T12:00:00Z",
    "environment": "staging",
    "version": "1.0.0"
  },
  "profiles": [
    {
      "profileId": "profile_1_beginner",
      "status": "passed",
      "confidence": {
        "actual": 0.82,
        "expected": "0.75-0.85", 
        "validation": "passed"
      },
      "rulesMatched": [
        "complete_beginner_web_foundation",
        "part_time_learning_journey",
        "visual_learning_optimized"
      ],
      "llmStatus": "success",
      "processingTime": "1.2s"
    }
  ],
  "summary": {
    "totalProfiles": 8,
    "passed": 8,
    "failed": 0,
    "successRate": "100%"
  }
}
```

### **Continuous Monitoring**

#### **Daily Health Checks**
```bash
#!/bin/bash
# daily-health-check.sh

echo "Running daily SkillNavigator health checks..."

# Test basic API health
curl -f http://localhost:3001/health || echo "❌ API health check failed"

# Test database connectivity
curl -f -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/stats || echo "❌ Database check failed"

# Test LLM integration
curl -f http://localhost:3001/api/debug/llm-health || echo "❌ LLM health check failed"

echo "Health checks complete"
```

#### **Weekly Regression Tests**
```bash
#!/bin/bash
# weekly-regression.sh

echo "Running weekly regression tests..."

# Run automated test suite
npm test || echo "❌ Automated tests failed"

# Run key test profiles
for profile in 1 2 3 7; do
  ./scripts/test-profile.sh $profile || echo "❌ Profile $profile failed"
done

echo "Regression tests complete"
```

## 🔍 **Debugging Failed Tests**

### **Common Failure Patterns**

#### **Confidence Score Out of Range**
1. Check rule matching - are expected rules firing?
2. Verify rule weights haven't changed unexpectedly  
3. Review fact normalization - are inputs processed correctly?
4. Analyze coverage - is user providing enough information?

#### **Unexpected Rule Matches**
1. Review rule conditions for edge cases
2. Check fact normalization logic
3. Verify rule priority/weight balance
4. Look for overlapping rule conditions

#### **LLM Integration Failures**
1. Check API key validity
2. Review prompt templates
3. Validate response format
4. Check timeout and retry settings

### **Debug Commands**
```bash
# Deep dive into specific session
curl http://localhost:3001/api/debug/session/$SESSION_ID | jq .

# Analyze rule performance
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/rules/performance | jq .

# Check system metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/metrics/dashboard | jq .
```

---

**Last Updated**: September 29, 2025  
**Version**: 1.0.0  
**Maintained By**: QA Team