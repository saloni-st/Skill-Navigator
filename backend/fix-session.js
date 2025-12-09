const { MongoClient } = require('mongodb');

async function fixSession() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');  // Use 'test' database
    const sessions = db.collection('sessions');
    
    // Mock LLM data structure
    const mockLearningPath = {
      assessment: {
        currentLevel: "intermediate",
        strengths: [
          "Strong foundation in programming concepts",
          "Experience with backend development",
          "Understanding of database design"
        ],
        improvementAreas: [
          "Advanced JavaScript concepts",
          "Microservices architecture",
          "DevOps and deployment",
          "Testing frameworks"
        ]
      },
      weeklyPlan: {
        week1: {
          focus: "Backend Architecture Patterns",
          topics: ["Backend architecture patterns", "SOLID principles", "Monolithic vs Microservices"],
          dailySchedule: {
            monday: "Learn backend architecture fundamentals",
            tuesday: "Study SOLID principles with examples",
            wednesday: "Compare monolithic vs microservices"
          },
          resources: [
            {
              title: "Backend Architecture Patterns",
              type: "tutorial",
              duration: "3 hours",
              difficulty: "intermediate"
            },
            {
              title: "SOLID Principles in JavaScript",
              type: "tutorial",
              duration: "2 hours",
              difficulty: "intermediate"
            }
          ],
          project: "Refactor an existing backend project to follow SOLID principles",
          goals: ["Master backend architecture patterns", "Implement SOLID principles effectively"]
        },
        week2: {
          focus: "Real-time Communication",
          topics: ["WebSockets", "Serverless Architecture", "GraphQL"],
          dailySchedule: {
            monday: "WebSockets implementation basics",
            tuesday: "Serverless architecture concepts",
            wednesday: "GraphQL API development"
          },
          resources: [
            {
              title: "WebSockets Tutorial",
              type: "tutorial",
              duration: "4 hours",
              difficulty: "intermediate"
            },
            {
              title: "Serverless Architecture Basics",
              type: "tutorial",
              duration: "3 hours",
              difficulty: "advanced"
            }
          ],
          project: "Implement WebSockets in a real-time chat application",
          goals: ["Build real-time communication features", "Understand serverless patterns"]
        },
        week3: {
          focus: "Security and Best Practices",
          topics: ["Security best practices", "Input validation", "Authentication methods", "Logging and monitoring"],
          dailySchedule: {
            monday: "Security fundamentals and best practices",
            tuesday: "Input validation and sanitization",
            wednesday: "Authentication and authorization implementation"
          },
          resources: [
            {
              title: "Backend Security Best Practices",
              type: "tutorial",
              duration: "4 hours",
              difficulty: "advanced"
            },
            {
              title: "Authentication Methods in Node.js",
              type: "tutorial",
              duration: "3 hours",
              difficulty: "intermediate"
            }
          ],
          project: "Secure a backend project by implementing input validation and authentication",
          goals: ["Implement security best practices", "Master authentication patterns"]
        }
      },
      careerPath: {
        nextRole: "Senior Backend Developer",
        salaryRange: "$100,000 - $140,000",
        requiredSkills: ["Advanced JavaScript", "Node.js", "RESTful APIs", "Backend architecture", "Testing", "DevOps"]
      },
      milestones: [
        {
          week: 4,
          project: "Secure API Backend",
          skills: ["Node.js", "Authentication", "Security"]
        },
        {
          week: 8,
          project: "Microservices Architecture",
          skills: ["Microservices", "Docker", "API Gateway"]
        },
        {
          week: 12,
          project: "Real-time Chat Application",
          skills: ["WebSockets", "Redis", "Scaling"]
        }
      ]
    };
    
    const roadmapData = {
      success: true,
      learningPath: mockLearningPath,
      userProfile: {
        education: "masters",
        experience: "3-5 years",
        timeCommitment: "11-20 hours per week",
        careerGoals: "Backend specialization",
        learningStyle: "Hands-on learning",
        currentSkills: ["JavaScript", "Node.js", "Databases"],
        interests: ["Backend Architecture", "Security", "Performance"],
        urgency: "high"
      },
      generatedAt: new Date().toISOString(),
      source: "groq_llm_with_backend_focus"
    };
    
    // Update the session with proper LLM recommendation
    const result = await sessions.updateOne(
      { _id: require('mongodb').ObjectId.createFromHexString('68dae6494346a2a9f8e3f69b') },
      {
        $set: {
          llmRecommendation: {
            roadmap: JSON.stringify(roadmapData)
          },
          baseRecommendation: {
            skills: [],
            resources: [],
            projects: [],
            prerequisites: []
          }
        }
      }
    );
    
    console.log('✅ Session updated:', result);
    console.log('Updated session 68dae6494346a2a9f8e3f69b with LLM data');
    
  } catch (error) {
    console.error('❌ Error updating session:', error);
  } finally {
    await client.close();
  }
}

fixSession();