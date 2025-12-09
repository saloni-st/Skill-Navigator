# Web Development Domain Rules (Human-Readable)

## Rule Format Template
```
Title: [Short descriptive name]
Priority: [1-10, where 10 is highest]
Match Mode: [all|any] 
Conditions: [fact operator value, ...]
Actions: [recommend_skill, recommend_resource, recommend_project, set_timeline, ...]
Explanation: [One sentence explaining why this rule fires]
```

---

## Rule Set for Web Development Domain

### Rule 1: Absolute Beginner Foundation
**Title**: "Complete Beginner Web Foundation"
**Priority**: 10 (Highest - foundational)
**Match Mode**: all
**Conditions**:
- experienceLevel equals "absolute_beginner"
- focusArea not equals "backend"
**Actions**:
- recommend_skill: "HTML/CSS" (priority: 10)
- recommend_skill: "Basic JavaScript" (priority: 9)
- recommend_resource: "MDN Web Docs" (type: documentation)
- recommend_resource: "freeCodeCamp HTML/CSS" (type: interactive)
- recommend_project: "Personal Portfolio Website" (difficulty: beginner)
- set_timeline: "4-6 weeks for HTML/CSS basics"
**Explanation**: "Starting with web fundamentals since you're new to programming"

---

### Rule 2: Frontend Specialist Path
**Title**: "Frontend Developer Specialization"
**Priority**: 9
**Match Mode**: all
**Conditions**:
- focusArea equals "frontend"
- experienceLevel not equals "absolute_beginner"
**Actions**:
- recommend_skill: "JavaScript ES6+" (priority: 10)
- recommend_skill: "React.js" (priority: 9)
- recommend_skill: "CSS Frameworks (Tailwind/Bootstrap)" (priority: 7)
- recommend_resource: "React Official Tutorial" (type: documentation)
- recommend_resource: "JavaScript30 Course" (type: video)
- recommend_project: "Interactive React Dashboard" (difficulty: intermediate)
- recommend_project: "E-commerce Frontend" (difficulty: advanced)
**Explanation**: "Focusing on modern frontend technologies for user interface development"

---

### Rule 3: Backend Specialist Path
**Title**: "Backend Developer Specialization" 
**Priority**: 9
**Match Mode**: all
**Conditions**:
- focusArea equals "backend" 
- experienceLevel not equals "absolute_beginner"
**Actions**:
- recommend_skill: "Node.js" (priority: 10)
- recommend_skill: "Express.js" (priority: 9)
- recommend_skill: "Database Design (MongoDB/PostgreSQL)" (priority: 8)
- recommend_skill: "REST API Development" (priority: 8)
- recommend_resource: "Node.js Documentation" (type: documentation)
- recommend_resource: "MongoDB University" (type: course)
- recommend_project: "REST API with Authentication" (difficulty: intermediate)
- recommend_project: "Real-time Chat Application" (difficulty: advanced)
**Explanation**: "Specializing in server-side development and API creation"

---

### Rule 4: Full-Stack Balanced Path
**Title**: "Full-Stack Developer Journey"
**Priority**: 8
**Match Mode**: all
**Conditions**:
- focusArea equals "fullstack"
- experienceLevel not equals "absolute_beginner"
**Actions**:
- recommend_skill: "JavaScript (Frontend + Backend)" (priority: 10)
- recommend_skill: "React.js" (priority: 9)
- recommend_skill: "Node.js/Express" (priority: 9)
- recommend_skill: "Database Integration" (priority: 7)
- recommend_resource: "Full-Stack Open Course" (type: course)
- recommend_project: "Complete CRUD Application" (difficulty: intermediate)
- recommend_project: "Social Media Clone" (difficulty: advanced)
**Explanation**: "Learning both frontend and backend to become a versatile full-stack developer"

---

### Rule 5: High-Intensity Fast Track
**Title**: "Intensive Learning Accelerated Path"
**Priority**: 8
**Match Mode**: all
**Conditions**:
- commitmentLevel equals "intensive"
- careerGoal equals "employment"
- experienceLevel not equals "absolute_beginner"
**Actions**:
- recommend_skill: "Core Stack Mastery" (priority: 10)
- recommend_skill: "Version Control (Git)" (priority: 9)
- recommend_skill: "Testing Fundamentals" (priority: 7)
- recommend_resource: "Intensive Bootcamp Style Course" (type: structured)
- recommend_project: "Portfolio with 3+ Projects" (difficulty: intermediate)
- recommend_project: "Deploy to Production" (difficulty: advanced)
- set_timeline: "8-12 weeks intensive program"
**Explanation**: "Accelerated path designed for career transition with full-time commitment"

---

### Rule 6: Casual Learner Paced Approach
**Title**: "Part-Time Learning Journey"
**Priority**: 7
**Match Mode**: all
**Conditions**:
- commitmentLevel equals "casual"
- studyHours less_than 10
**Actions**:
- recommend_skill: "One Core Technology at a Time" (priority: 10)
- recommend_resource: "Bite-sized Video Tutorials" (type: video)
- recommend_resource: "Weekend Project Ideas" (type: project_list)
- recommend_project: "Simple Landing Page" (difficulty: beginner)
- set_timeline: "16-24 weeks for foundational skills"
**Explanation**: "Gradual learning approach that fits your available time commitment"

---

### Rule 7: Job-Seeker Market Readiness
**Title**: "Employment-Ready Skill Stack"
**Priority**: 9
**Match Mode**: all
**Conditions**:
- careerGoal equals "employment"
- experienceLevel in ["intermediate", "advanced"]
**Actions**:
- recommend_skill: "Portfolio Development" (priority: 10)
- recommend_skill: "Interview Preparation" (priority: 9)
- recommend_skill: "Industry Best Practices" (priority: 8)
- recommend_resource: "Technical Interview Prep" (type: course)
- recommend_resource: "Resume Building for Developers" (type: guide)
- recommend_project: "Industry-Standard Application" (difficulty: advanced)
- recommend_project: "Open Source Contribution" (difficulty: intermediate)
**Explanation**: "Building job-ready skills and portfolio to stand out to employers"

---

### Rule 8: Freelance Business Skills
**Title**: "Freelance Developer Toolkit"
**Priority**: 7
**Match Mode**: all
**Conditions**:
- careerGoal equals "freelance"
**Actions**:
- recommend_skill: "Client Communication" (priority: 8)
- recommend_skill: "Project Management" (priority: 7)
- recommend_skill: "Quick Prototyping" (priority: 9)
- recommend_resource: "Freelance Business Guide" (type: guide)
- recommend_resource: "Client Management Tools" (type: tools)
- recommend_project: "Client Landing Page Template" (difficulty: intermediate)
**Explanation**: "Developing both technical and business skills needed for successful freelancing"

---

### Rule 9: Hands-On Project Learner
**Title**: "Project-Based Learning Focus"
**Priority**: 6
**Match Mode**: any
**Conditions**:
- learningPreferences contains "kinesthetic"
- learningPreferences contains "hands_on"
**Actions**:
- recommend_resource: "Project-Based Tutorials" (type: project_tutorial)
- recommend_resource: "Build-Along Courses" (type: video)
- recommend_project: "Clone Popular Website" (difficulty: intermediate)
- recommend_project: "Build Your Own Tool" (difficulty: advanced)
**Explanation**: "Emphasizing practical projects since you learn best by building things"

---

### Rule 10: Advanced Learner Specialization
**Title**: "Advanced Developer Deep Dive"
**Priority**: 8
**Match Mode**: all
**Conditions**:
- experienceLevel equals "advanced"
- studyHours greater_than 15
**Actions**:
- recommend_skill: "Advanced Architecture Patterns" (priority: 9)
- recommend_skill: "Performance Optimization" (priority: 8)
- recommend_skill: "DevOps Basics" (priority: 7)
- recommend_resource: "Advanced JavaScript Concepts" (type: course)
- recommend_project: "Scalable Web Application" (difficulty: expert)
- recommend_project: "Technical Blog/Tutorial Series" (difficulty: advanced)
**Explanation**: "Advanced topics to elevate your expertise and leadership potential"

---

### Rule 11: Exploration Path for Undecided
**Title**: "Web Development Exploration"
**Priority**: 6
**Match Mode**: all
**Conditions**:
- focusArea equals "exploration"
- experienceLevel in ["absolute_beginner", "beginner"]
**Actions**:
- recommend_skill: "HTML/CSS Fundamentals" (priority: 10)
- recommend_skill: "JavaScript Basics" (priority: 9)
- recommend_skill: "Try Multiple Frameworks" (priority: 6)
- recommend_resource: "Overview of Web Technologies" (type: guide)
- recommend_project: "Frontend vs Backend Comparison Project" (difficulty: beginner)
- set_timeline: "4-6 weeks exploration phase"
**Explanation**: "Broad exposure to web technologies to help you discover your preferred specialization"

---

### Rule 12: Fallback/Default Rule
**Title**: "Standard Web Development Path"
**Priority**: 1 (Lowest - only if no other rules match)
**Match Mode**: all
**Conditions**:
- experienceLevel not equals ""
**Actions**:
- recommend_skill: "HTML/CSS" (priority: 8)
- recommend_skill: "JavaScript" (priority: 8)
- recommend_resource: "General Web Development Course" (type: course)
- recommend_project: "Basic Website" (difficulty: beginner)
- set_timeline: "12-16 weeks standard learning path"
**Explanation**: "Standard web development learning path covering essential technologies"

---

## Rule Priority Explanation
- **Priority 10-9**: Foundation and specialization rules (most important)
- **Priority 8-7**: Commitment level and career goal rules
- **Priority 6-5**: Learning style and preference rules  
- **Priority 4-1**: Enhancement and fallback rules

## Match Mode Guidelines
- **"all"**: All conditions must be true (strict matching)
- **"any"**: At least one condition must be true (flexible matching)

This rule set provides comprehensive coverage for different user profiles while maintaining explainability and deterministic behavior.