# Test Profiles for Web Development Inference Engine

## Profile 1: Complete Beginner - Casual Learner
**Profile Name**: Sarah the Newcomer
**Answers**:
- education_level: "bachelors"
- coding_experience: "0" 
- weekly_hours: "5"
- web_dev_focus: "frontend"
- career_goal: "personal_projects"
- learning_style: ["video_courses"]

**Normalized Facts**:
- experienceLevel: "absolute_beginner", experienceYears: 0
- studyHours: 5, commitmentLevel: "casual"
- focusArea: "frontend", careerPath: "frontend_specialist"
- careerGoal: "hobby", urgency: "low"
- learningPreferences: ["visual"], resourceTypes: ["video"]

**Expected Rules to Fire**: 
1. Complete Beginner Web Foundation (Priority 10)
2. Part-Time Learning Journey (Priority 7)
3. Project-Based Learning Focus (if hands-on included)

**Expected Base Recommendation**:
- Skills: HTML/CSS (primary), Basic JavaScript
- Resources: MDN Web Docs, freeCodeCamp, Video tutorials
- Projects: Personal Portfolio Website
- Timeline: 20-24 weeks (casual + beginner)

---

## Profile 2: Career Switcher - Intensive
**Profile Name**: Mike the Career Changer  
**Answers**:
- education_level: "masters"
- coding_experience: "1"
- weekly_hours: "40" 
- web_dev_focus: "fullstack"
- career_goal: "job_switch"
- learning_style: ["structured_course", "hands_on"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 0.5
- studyHours: 40, commitmentLevel: "intensive"
- focusArea: "fullstack", careerPath: "fullstack_developer"
- careerGoal: "employment", urgency: "high"
- learningPreferences: ["structured", "kinesthetic"]

**Expected Rules to Fire**:
1. Full-Stack Developer Journey (Priority 8)
2. Intensive Learning Accelerated Path (Priority 8)
3. Employment-Ready Skill Stack (when reaches intermediate)

**Expected Base Recommendation**:
- Skills: JavaScript (Frontend + Backend), React.js, Node.js/Express
- Resources: Full-Stack Open Course, Intensive bootcamp materials
- Projects: Complete CRUD Application, Portfolio with 3+ Projects
- Timeline: 8-12 weeks intensive program

---

## Profile 3: Experienced Developer - Backend Focus
**Profile Name**: Alex the Backend Specialist
**Answers**:
- education_level: "bootcamp"
- coding_experience: "3"
- weekly_hours: "20"
- web_dev_focus: "backend"
- career_goal: "skill_upgrade"
- learning_style: ["documentation", "hands_on"]

**Normalized Facts**:
- experienceLevel: "intermediate", experienceYears: 2.5
- studyHours: 20, commitmentLevel: "serious"
- focusArea: "backend", careerPath: "backend_specialist"
- careerGoal: "upskilling", urgency: "low"
- learningPreferences: ["reading", "kinesthetic"]

**Expected Rules to Fire**:
1. Backend Developer Specialization (Priority 9)
2. Project-Based Learning Focus (Priority 6)
3. Advanced Developer Deep Dive (Priority 8, if advanced)

**Expected Base Recommendation**:
- Skills: Node.js, Express.js, Database Design, REST API Development
- Resources: Node.js Documentation, MongoDB University
- Projects: REST API with Authentication, Real-time Chat Application
- Timeline: 8-12 weeks for skill advancement

---

## Profile 4: Advanced Developer - High Commitment
**Profile Name**: Jessica the Expert
**Answers**:
- education_level: "masters"
- coding_experience: "5+"
- weekly_hours: "20"
- web_dev_focus: "frontend"
- career_goal: "freelance"
- learning_style: ["documentation", "community"]

**Normalized Facts**:
- experienceLevel: "advanced", experienceYears: 6
- studyHours: 20, commitmentLevel: "serious"
- focusArea: "frontend", careerPath: "frontend_specialist"
- careerGoal: "freelance", urgency: "medium"
- learningPreferences: ["reading", "social"]

**Expected Rules to Fire**:
1. Frontend Developer Specialization (Priority 9)
2. Advanced Developer Deep Dive (Priority 8)
3. Freelance Developer Toolkit (Priority 7)

**Expected Base Recommendation**:
- Skills: Advanced Architecture Patterns, Performance Optimization, Client Communication
- Resources: Advanced JavaScript Concepts, Freelance Business Guide
- Projects: Scalable Web Application, Client Landing Page Template
- Timeline: 4-8 weeks for specialization

---

## Profile 5: Self-Taught Explorer
**Profile Name**: David the Explorer
**Answers**:
- education_level: "self_taught"
- coding_experience: "2"
- weekly_hours: "10"
- web_dev_focus: "unsure"
- career_goal: "side_business"
- learning_style: ["hands_on", "video_courses"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 1.5
- studyHours: 10, commitmentLevel: "consistent"
- focusArea: "exploration", careerPath: "generalist"
- careerGoal: "entrepreneurship", urgency: "medium"
- learningPreferences: ["kinesthetic", "visual"]

**Expected Rules to Fire**:
1. Web Development Exploration (Priority 6)
2. Project-Based Learning Focus (Priority 6)
3. Freelance Developer Toolkit (applicable for entrepreneurship)

**Expected Base Recommendation**:
- Skills: HTML/CSS Fundamentals, JavaScript Basics, Try Multiple Frameworks
- Resources: Overview of Web Technologies, Project-Based Tutorials
- Projects: Frontend vs Backend Comparison Project
- Timeline: 12-16 weeks exploration + specialization

---

## Profile 6: Part-Time Student
**Profile Name**: Emma the Student
**Answers**:
- education_level: "high_school"
- coding_experience: "0"
- weekly_hours: "5"
- web_dev_focus: "mobile"
- career_goal: "personal_projects"
- learning_style: ["video_courses", "structured_course"]

**Normalized Facts**:
- experienceLevel: "absolute_beginner", experienceYears: 0
- studyHours: 5, commitmentLevel: "casual"
- focusArea: "mobile_web", careerPath: "mobile_specialist"
- careerGoal: "hobby", urgency: "low"
- learningPreferences: ["visual", "structured"]

**Expected Rules to Fire**:
1. Complete Beginner Web Foundation (Priority 10)
2. Part-Time Learning Journey (Priority 7)

**Expected Base Recommendation**:
- Skills: HTML/CSS, Basic JavaScript (foundation before mobile)
- Resources: Bite-sized Video Tutorials, Structured beginner courses
- Projects: Simple Landing Page, Personal Portfolio Website
- Timeline: 20-24 weeks gradual learning

---

## Profile 7: Bootcamp Graduate - Job Ready
**Profile Name**: Carlos the Bootcamp Grad
**Answers**:
- education_level: "bootcamp"
- coding_experience: "2"
- weekly_hours: "20"
- web_dev_focus: "fullstack"
- career_goal: "job_switch"
- learning_style: ["hands_on", "community"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 1.5
- studyHours: 20, commitmentLevel: "serious"
- focusArea: "fullstack", careerPath: "fullstack_developer"
- careerGoal: "employment", urgency: "high"
- learningPreferences: ["kinesthetic", "social"]

**Expected Rules to Fire**:
1. Full-Stack Developer Journey (Priority 8)
2. Employment-Ready Skill Stack (Priority 9)
3. Project-Based Learning Focus (Priority 6)

**Expected Base Recommendation**:
- Skills: Portfolio Development, Interview Preparation, Industry Best Practices
- Resources: Technical Interview Prep, Community learning platforms
- Projects: Industry-Standard Application, Open Source Contribution
- Timeline: 8-12 weeks job preparation

---

## Profile 8: Inconsistent Profile (Edge Case)
**Profile Name**: Robert the Inconsistent
**Answers**:
- education_level: "phd"
- coding_experience: "5+" 
- weekly_hours: "5"
- web_dev_focus: "frontend"
- career_goal: "job_switch"
- learning_style: ["documentation"]

**Normalized Facts**:
- experienceLevel: "advanced", experienceYears: 6
- studyHours: 5, commitmentLevel: "casual"
- focusArea: "frontend", careerPath: "frontend_specialist"
- careerGoal: "employment", urgency: "high"
- Flag: "inconsistent_profile" (advanced but low time commitment for employment goal)

**Expected Rules to Fire**:
1. Frontend Developer Specialization (Priority 9)
2. Advanced Developer Deep Dive (Priority 8)
3. Reality check warning in trace

**Expected Base Recommendation**:
- Skills: Advanced Frontend topics (but with reality check)
- Resources: Documentation-heavy resources
- Warning: Current time commitment may not align with employment timeline
- Timeline: Extended due to low hours despite advanced level

---

## Profile 9: Visual Learner - Frontend
**Profile Name**: Sophia the Visual Designer
**Answers**:
- education_level: "bachelors"
- coding_experience: "1"
- weekly_hours: "15"
- web_dev_focus: "frontend"
- career_goal: "freelance"
- learning_style: ["video_courses", "hands_on"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 0.5
- studyHours: 15, commitmentLevel: "consistent"
- focusArea: "frontend", careerPath: "frontend_specialist"
- careerGoal: "freelance", urgency: "medium"
- learningPreferences: ["visual", "kinesthetic"]

**Expected Rules to Fire**:
1. Frontend Developer Specialization (Priority 9)
2. Freelance Developer Toolkit (Priority 7)
3. Project-Based Learning Focus (Priority 6)

**Expected Base Recommendation**:
- Skills: JavaScript ES6+, React.js, CSS Frameworks
- Resources: Video tutorials, Build-Along Courses
- Projects: Interactive React Dashboard, Client Landing Page Template
- Timeline: 12-16 weeks consistent learning

---

## Profile 10: Community Learner
**Profile Name**: Ahmed the Social Learner
**Answers**:
- education_level: "bachelors"
- coding_experience: "2"
- weekly_hours: "10"
- web_dev_focus: "backend"
- career_goal: "skill_upgrade"
- learning_style: ["community", "structured_course"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 1.5
- studyHours: 10, commitmentLevel: "consistent"
- focusArea: "backend", careerPath: "backend_specialist"
- careerGoal: "upskilling", urgency: "low"
- learningPreferences: ["social", "structured"]

**Expected Rules to Fire**:
1. Backend Developer Specialization (Priority 9)
2. Standard learning pace rules

**Expected Base Recommendation**:
- Skills: Node.js, Express.js, Database Design
- Resources: Community learning platforms, MongoDB University
- Projects: REST API with Authentication
- Timeline: 12-16 weeks structured learning

---

## Profile 11: Minimal Commitment
**Profile Name**: Lisa the Busy Professional
**Answers**:
- education_level: "masters"
- coding_experience: "0"
- weekly_hours: "5"
- web_dev_focus: "frontend"
- career_goal: "personal_projects"
- learning_style: ["video_courses"]

**Normalized Facts**:
- experienceLevel: "absolute_beginner", experienceYears: 0
- studyHours: 5, commitmentLevel: "casual"
- focusArea: "frontend", careerPath: "frontend_specialist"
- careerGoal: "hobby", urgency: "low"
- learningPreferences: ["visual"]

**Expected Rules to Fire**:
1. Complete Beginner Web Foundation (Priority 10)
2. Part-Time Learning Journey (Priority 7)

**Expected Base Recommendation**:
- Skills: HTML/CSS, Basic JavaScript (one at a time)
- Resources: Bite-sized Video Tutorials, Weekend Project Ideas
- Projects: Simple Landing Page
- Timeline: 20-24 weeks very gradual

---

## Profile 12: No Clear Rules Match (Edge Case)
**Profile Name**: Generic User
**Answers**:
- education_level: "bachelors"
- coding_experience: "2"
- weekly_hours: "10"
- web_dev_focus: "fullstack"
- career_goal: "skill_upgrade"
- learning_style: ["documentation"]

**Normalized Facts**:
- experienceLevel: "beginner", experienceYears: 1.5
- studyHours: 10, commitmentLevel: "consistent"
- focusArea: "fullstack", careerPath: "fullstack_developer"
- careerGoal: "upskilling", urgency: "low"
- learningPreferences: ["reading"]

**Expected Rules to Fire**:
1. Full-Stack Developer Journey (Priority 8)
2. Standard Web Development Path (Priority 1, fallback if needed)

**Expected Base Recommendation**:
- Skills: JavaScript (Frontend + Backend), React.js, Node.js/Express
- Resources: Documentation-focused resources
- Projects: Complete CRUD Application
- Timeline: 12-16 weeks standard path

---

## Coverage Analysis

**Rules Coverage**:
- Rule 1 (Absolute Beginner): Profiles 1, 6, 11
- Rule 2 (Frontend): Profiles 1, 4, 8, 9
- Rule 3 (Backend): Profiles 3, 10
- Rule 4 (Full-Stack): Profiles 2, 7, 12
- Rule 5 (Intensive): Profile 2
- Rule 6 (Casual): Profiles 1, 6, 8, 11
- Rule 7 (Job-Seeker): Profiles 2, 7
- Rule 8 (Freelance): Profiles 4, 9
- Rule 9 (Hands-On): Profiles 2, 3, 5, 7, 9
- Rule 10 (Advanced): Profiles 4, 8
- Rule 11 (Explorer): Profile 5
- Rule 12 (Fallback): Profile 12 (if others don't match)

**Profile Types**:
- Complete beginners: 3 profiles
- Career switchers: 3 profiles
- Skill upgraders: 3 profiles
- Hobbyists: 3 profiles
- Edge cases: 2 profiles

This provides comprehensive coverage for testing all rule combinations and edge cases.