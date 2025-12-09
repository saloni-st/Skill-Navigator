# Facts Mapping Document - Web Development Domain

## Overview
This document defines how questionnaire answers are normalized into facts that the inference engine can process deterministically.

## Question → Fact Mapping

### 1. Education Level
- **Question ID**: `education_level`
- **Fact Key**: `educationLevel`
- **Type**: `string (enum)`
- **Normalization Rules**:
  ```
  "high_school" → "high_school"
  "bachelors" → "bachelors" 
  "masters" → "masters"
  "phd" → "phd"
  "bootcamp" → "bootcamp"
  "self_taught" → "self_taught"
  ```
- **Inference Weight**: Higher education = higher learning capacity

### 2. Coding Experience
- **Question ID**: `coding_experience`
- **Fact Key**: `experienceLevel` + `experienceYears`
- **Type**: `string (enum)` + `number`
- **Normalization Rules**:
  ```
  "0" → experienceLevel: "absolute_beginner", experienceYears: 0
  "1" → experienceLevel: "beginner", experienceYears: 0.5
  "2" → experienceLevel: "beginner", experienceYears: 1.5
  "3" → experienceLevel: "intermediate", experienceYears: 2.5
  "5" → experienceLevel: "intermediate", experienceYears: 4
  "5+" → experienceLevel: "advanced", experienceYears: 6
  ```
- **Inference Weight**: Experience level determines starting point and pace

### 3. Weekly Hours
- **Question ID**: `weekly_hours`
- **Fact Key**: `studyHours` + `commitmentLevel`
- **Type**: `number` + `string (enum)`
- **Normalization Rules**:
  ```
  "5" → studyHours: 5, commitmentLevel: "casual"
  "10" → studyHours: 10, commitmentLevel: "consistent" 
  "20" → studyHours: 20, commitmentLevel: "serious"
  "40" → studyHours: 40, commitmentLevel: "intensive"
  ```
- **Inference Weight**: Determines timeline and depth of recommendations

### 4. Web Development Focus
- **Question ID**: `web_dev_focus`
- **Fact Key**: `focusArea` + `careerPath`
- **Type**: `string (enum)`
- **Normalization Rules**:
  ```
  "frontend" → focusArea: "frontend", careerPath: "frontend_specialist"
  "backend" → focusArea: "backend", careerPath: "backend_specialist"
  "fullstack" → focusArea: "fullstack", careerPath: "fullstack_developer"
  "mobile" → focusArea: "mobile_web", careerPath: "mobile_specialist"
  "unsure" → focusArea: "exploration", careerPath: "generalist"
  ```
- **Inference Weight**: Primary driver for skill recommendations

### 5. Career Goal
- **Question ID**: `career_goal`
- **Fact Key**: `careerGoal` + `urgency`
- **Type**: `string (enum)` + `string (enum)`
- **Normalization Rules**:
  ```
  "job_switch" → careerGoal: "employment", urgency: "high"
  "freelance" → careerGoal: "freelance", urgency: "medium"
  "side_business" → careerGoal: "entrepreneurship", urgency: "medium"
  "skill_upgrade" → careerGoal: "upskilling", urgency: "low"
  "personal_projects" → careerGoal: "hobby", urgency: "low"
  ```
- **Inference Weight**: Influences project complexity and timeline

### 6. Learning Style (Multiple Choice)
- **Question ID**: `learning_style`
- **Fact Key**: `learningPreferences` + `resourceTypes`
- **Type**: `array[string]` + `array[string]`
- **Normalization Rules**:
  ```
  ["video_courses"] → learningPreferences: ["visual"], resourceTypes: ["video"]
  ["documentation"] → learningPreferences: ["reading"], resourceTypes: ["docs"]
  ["hands_on"] → learningPreferences: ["kinesthetic"], resourceTypes: ["projects"]
  ["structured_course"] → learningPreferences: ["structured"], resourceTypes: ["course"]
  ["community"] → learningPreferences: ["social"], resourceTypes: ["community"]
  
  Multiple selections combine arrays
  ```
- **Inference Weight**: Determines resource type recommendations

## Text Processing Rules (for future short-text questions)

### Keywords → Skills Mapping
```
"js", "javascript", "JS" → "JavaScript"
"react", "reactjs", "react.js" → "React.js"
"node", "nodejs", "node.js" → "Node.js"
"html", "HTML5" → "HTML/CSS"
"css", "css3", "styling" → "HTML/CSS"
"python", "py" → "Python"
"java" → "Java" (not JavaScript)
```

### Experience Level Synonyms
```
"never coded", "complete beginner", "no experience" → "absolute_beginner"
"little experience", "just started", "learning" → "beginner"
"some experience", "intermediate" → "intermediate"
"experienced", "professional", "expert" → "advanced"
```

### Time Commitment Synonyms
```
"few hours", "part time", "weekends" → "casual"
"daily", "regular", "consistent" → "consistent"
"full time", "intensive", "bootcamp style" → "intensive"
```

## Derived Facts (Calculated during normalization)

### Learning Velocity
```
studyHours + experienceLevel → learningVelocity
- studyHours >= 20 AND experienceLevel != "absolute_beginner" → "fast"
- studyHours >= 10 AND experienceLevel != "absolute_beginner" → "normal"
- studyHours < 10 OR experienceLevel == "absolute_beginner" → "slow"
```

### Timeline Estimation
```
Based on commitmentLevel + experienceLevel:
- intensive + advanced → "4-8 weeks"
- serious + intermediate → "8-12 weeks"
- consistent + beginner → "12-16 weeks"
- casual + absolute_beginner → "20-24 weeks"
```

### Skill Readiness
```
Based on experienceLevel + focusArea:
- absolute_beginner → start with "HTML/CSS"
- beginner + frontend → include "JavaScript"
- intermediate + fullstack → include "Backend Framework"
```

## Normalization Edge Cases

### Conflicting Answers
```
If experienceLevel == "advanced" BUT studyHours == "5":
→ Treat as "inconsistent_profile"
→ Ask clarifying question OR default to conservative (beginner)
```

### Missing Required Answers
```
If any required fact is missing:
→ Use domain default (e.g., experienceLevel = "beginner")
→ Flag session as "incomplete_profile"
```

### Invalid Combinations
```
If careerGoal == "employment" BUT studyHours == "5":
→ Flag as "unrealistic_expectations"
→ Include reality check in recommendations
```

## Validation Rules

1. **Required Facts**: `experienceLevel`, `studyHours`, `focusArea`, `careerGoal`
2. **Optional Facts**: `learningPreferences`, `educationLevel`
3. **Derived Facts**: All calculated during normalization
4. **Consistency Checks**: Cross-validate related facts

This mapping ensures deterministic, explainable fact extraction from questionnaire answers.