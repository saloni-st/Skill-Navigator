const { MongoClient } = require('mongodb');

// Enhanced domain-specific question sets
const improvedQuestionSets = {
  webDevelopment: [
    {
      question: "What's your current experience level with web development?",
      type: "single_choice",
      key: "web_experience_level",
      options: [
        { value: "absolute_beginner", label: "Absolute beginner (never coded)" },
        { value: "html_css_basics", label: "Know HTML/CSS basics" },
        { value: "javascript_familiar", label: "Familiar with JavaScript" },
        { value: "framework_experience", label: "Used frameworks (React/Vue/Angular)" },
        { value: "fullstack_developer", label: "Full-stack developer" }
      ]
    },
    {
      question: "Which web development path interests you most?",
      type: "single_choice", 
      key: "web_development_focus",
      options: [
        { value: "frontend", label: "Frontend Development (UI/UX, React, Vue)" },
        { value: "backend", label: "Backend Development (APIs, Databases, Server)" },
        { value: "fullstack", label: "Full-Stack Development (Frontend + Backend)" },
        { value: "mobile_web", label: "Mobile Web Development (PWA, React Native)" },
        { value: "wordpress", label: "WordPress/CMS Development" }
      ]
    },
    {
      question: "What's your experience with JavaScript?",
      type: "single_choice",
      key: "javascript_level",
      options: [
        { value: "none", label: "Never used JavaScript" },
        { value: "basic", label: "Basic syntax and DOM manipulation" },
        { value: "intermediate", label: "ES6+, async/await, APIs" },
        { value: "advanced", label: "Advanced patterns, frameworks, tooling" },
        { value: "expert", label: "Expert level (Node.js, TypeScript, etc.)" }
      ]
    },
    {
      question: "Which technologies do you want to learn or improve?",
      type: "multiple_choice",
      key: "web_technologies",
      options: [
        { value: "react", label: "React.js" },
        { value: "vue", label: "Vue.js" },
        { value: "angular", label: "Angular" },
        { value: "nodejs", label: "Node.js" },
        { value: "typescript", label: "TypeScript" },
        { value: "databases", label: "Databases (SQL/NoSQL)" },
        { value: "aws", label: "Cloud (AWS/Azure)" },
        { value: "devops", label: "DevOps & Deployment" }
      ]
    },
    {
      question: "What's your primary web development goal?",
      type: "single_choice",
      key: "web_career_goal",
      options: [
        { value: "first_job", label: "Get my first web developer job" },
        { value: "career_change", label: "Switch from another field to web dev" },
        { value: "skill_upgrade", label: "Upgrade skills in current web dev role" },
        { value: "freelance", label: "Start freelancing/consulting" },
        { value: "startup", label: "Build my own web applications/startup" }
      ]
    },
    {
      question: "How much time can you dedicate per week?",
      type: "single_choice",
      key: "time_commitment",
      options: [
        { value: "5_hours", label: "5-10 hours (casual pace)" },
        { value: "15_hours", label: "10-15 hours (steady progress)" },
        { value: "25_hours", label: "20-25 hours (intensive learning)" },
        { value: "fulltime", label: "30+ hours (bootcamp intensity)" }
      ]
    }
  ],

  cybersecurity: [
    {
      question: "What's your current cybersecurity knowledge level?",
      type: "single_choice",
      key: "security_experience",
      options: [
        { value: "complete_beginner", label: "Complete beginner (no security knowledge)" },
        { value: "basic_awareness", label: "Basic security awareness" },
        { value: "some_experience", label: "Some IT/networking experience" },
        { value: "intermediate", label: "Intermediate (some security tools/concepts)" },
        { value: "advanced", label: "Advanced (working in IT/security)" }
      ]
    },
    {
      question: "Which cybersecurity specialization interests you most?",
      type: "single_choice",
      key: "security_specialization",
      options: [
        { value: "ethical_hacking", label: "Ethical Hacking & Penetration Testing" },
        { value: "security_analysis", label: "Security Operations & Incident Response" },
        { value: "digital_forensics", label: "Digital Forensics & Investigation" },
        { value: "compliance", label: "Compliance & Risk Management" },
        { value: "cloud_security", label: "Cloud Security (AWS/Azure)" },
        { value: "malware_analysis", label: "Malware Analysis & Reverse Engineering" }
      ]
    },
    {
      question: "What's your technical background?",
      type: "single_choice",
      key: "technical_background",
      options: [
        { value: "no_technical", label: "No technical background" },
        { value: "basic_it", label: "Basic IT knowledge" },
        { value: "networking", label: "Networking experience" },
        { value: "programming", label: "Programming experience" },
        { value: "systems_admin", label: "System administration experience" }
      ]
    },
    {
      question: "Which cybersecurity certifications are you interested in?",
      type: "multiple_choice",
      key: "security_certifications",
      options: [
        { value: "comptia_security", label: "CompTIA Security+" },
        { value: "ceh", label: "Certified Ethical Hacker (CEH)" },
        { value: "cissp", label: "CISSP" },
        { value: "oscp", label: "OSCP (Offensive Security)" },
        { value: "cisa", label: "CISA" },
        { value: "aws_security", label: "AWS Security Specialty" }
      ]
    },
    {
      question: "What's your cybersecurity career goal?",
      type: "single_choice",
      key: "security_career_goal",
      options: [
        { value: "entry_level", label: "Entry-level security analyst position" },
        { value: "penetration_tester", label: "Penetration tester/ethical hacker" },
        { value: "security_engineer", label: "Security engineer" },
        { value: "consultant", label: "Security consultant" },
        { value: "leadership", label: "Security leadership/management" }
      ]
    },
    {
      question: "How do you prefer to practice cybersecurity skills?",
      type: "multiple_choice",
      key: "security_practice",
      options: [
        { value: "home_lab", label: "Home lab setup" },
        { value: "virtual_machines", label: "Virtual machines & simulations" },
        { value: "online_platforms", label: "Online platforms (TryHackMe, HackTheBox)" },
        { value: "ctf", label: "Capture The Flag (CTF) competitions" },
        { value: "real_projects", label: "Real-world projects" }
      ]
    }
  ],

  dataScience: [
    {
      question: "What's your current data science experience level?",
      type: "single_choice",
      key: "ds_experience",
      options: [
        { value: "complete_beginner", label: "Complete beginner (no data experience)" },
        { value: "excel_user", label: "Excel/Google Sheets user" },
        { value: "basic_analytics", label: "Basic analytics & reporting" },
        { value: "some_programming", label: "Some Python/R programming" },
        { value: "experienced", label: "Experienced in data analysis/ML" }
      ]
    },
    {
      question: "Which data science path interests you most?",
      type: "single_choice",
      key: "ds_specialization",
      options: [
        { value: "data_analysis", label: "Data Analysis & Business Intelligence" },
        { value: "machine_learning", label: "Machine Learning & AI" },
        { value: "data_engineering", label: "Data Engineering & Big Data" },
        { value: "data_visualization", label: "Data Visualization & Storytelling" },
        { value: "research", label: "Data Science Research" },
        { value: "mlops", label: "MLOps & Model Deployment" }
      ]
    },
    {
      question: "What's your mathematics/statistics background?",
      type: "single_choice",
      key: "math_background",
      options: [
        { value: "weak", label: "Weak (need to learn from basics)" },
        { value: "high_school", label: "High school level" },
        { value: "undergraduate", label: "Undergraduate level (calculus, statistics)" },
        { value: "strong", label: "Strong (advanced math/stats)" },
        { value: "expert", label: "Expert (PhD level mathematics)" }
      ]
    },
    {
      question: "Which programming languages do you know or want to learn?",
      type: "multiple_choice",
      key: "ds_programming",
      options: [
        { value: "python", label: "Python (pandas, numpy, scikit-learn)" },
        { value: "r", label: "R Programming" },
        { value: "sql", label: "SQL" },
        { value: "scala", label: "Scala (for big data)" },
        { value: "julia", label: "Julia" },
        { value: "no_programming", label: "No programming experience" }
      ]
    },
    {
      question: "What's your primary data science career goal?",
      type: "single_choice",
      key: "ds_career_goal",
      options: [
        { value: "data_analyst", label: "Data Analyst (business insights)" },
        { value: "data_scientist", label: "Data Scientist (ML models)" },
        { value: "ml_engineer", label: "ML Engineer (model deployment)" },
        { value: "data_engineer", label: "Data Engineer (data pipelines)" },
        { value: "research_scientist", label: "Research Scientist" }
      ]
    },
    {
      question: "Which data science tools/platforms interest you?",
      type: "multiple_choice",
      key: "ds_tools",
      options: [
        { value: "jupyter", label: "Jupyter Notebooks" },
        { value: "tableau", label: "Tableau/Power BI" },
        { value: "spark", label: "Apache Spark" },
        { value: "tensorflow", label: "TensorFlow/PyTorch" },
        { value: "aws_ml", label: "AWS/Azure ML Services" },
        { value: "docker", label: "Docker/Kubernetes for ML" }
      ]
    }
  ]
};

async function updateQuestionSets() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');
    
    const domains = await db.collection('domains').find({}).toArray();
    const questionSets = db.collection('questionsets');
    
    console.log('🔄 Updating question sets with improved domain-specific questions...\n');
    
    for (const domain of domains) {
      let newQuestions = [];
      
      if (domain.name === 'Web Development') {
        newQuestions = improvedQuestionSets.webDevelopment;
        console.log('📱 Updating Web Development questions...');
      } else if (domain.name === 'Cybersecurity') {
        newQuestions = improvedQuestionSets.cybersecurity;
        console.log('🔒 Updating Cybersecurity questions...');
      } else if (domain.name === 'Data Science') {
        newQuestions = improvedQuestionSets.dataScience;
        console.log('📊 Updating Data Science questions...');
      }
      
      if (newQuestions.length > 0) {
        const result = await questionSets.updateOne(
          { _id: domain.questionSetId },
          { 
            $set: { 
              questions: newQuestions,
              updatedAt: new Date()
            } 
          }
        );
        
        console.log(`✅ Updated ${domain.name}: ${result.modifiedCount} question set modified`);
        console.log(`   Questions count: ${newQuestions.length}`);
        console.log(`   Sample question: "${newQuestions[0].question}"`);
        console.log('');
      }
    }
    
    console.log('🎉 All question sets updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating question sets:', error);
  } finally {
    await client.close();
  }
}

updateQuestionSets();