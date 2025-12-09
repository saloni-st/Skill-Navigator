'use client';

import { useState, useEffect } from 'react';

export default function TestResultPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        setLoading(true);
        const sessionId = '68dada529fb7adda7942e5c4';
        
        // Direct API call to test endpoint (no auth required)
        const response = await fetch(`http://localhost:3001/api/results/test/${sessionId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('🧪 Test API Response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch result');
        }
        
        // Parse LLM roadmap if it's a JSON string
        if (data.llmRecommendation?.roadmap && typeof data.llmRecommendation.roadmap === 'string') {
          try {
            const parsedRoadmap = JSON.parse(data.llmRecommendation.roadmap);
            console.log('🎯 Parsed LLM roadmap:', parsedRoadmap);
            data.llmRecommendation.roadmap = parsedRoadmap;
          } catch (error) {
            console.error('❌ Failed to parse LLM roadmap:', error);
          }
        }
        
        setResult(data);
      } catch (err) {
        console.error('❌ Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Loading LLM Test Result...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>No Result Found</h1>
      </div>
    );
  }

  const llmPlan = result.llmRecommendation?.roadmap?.learningPath;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 LLM Test Result</h1>
      <p><strong>Session ID:</strong> {result.sessionId}</p>
      <p><strong>Domain:</strong> {result.session.domain.name}</p>
      <p><strong>Status:</strong> {result.session.status}</p>
      
      {llmPlan && (
        <div style={{ marginTop: '30px' }}>
          <h2>🎯 AI-Generated Learning Plan</h2>
          
          {llmPlan.assessment && (
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>📊 Assessment</h3>
              <p><strong>Current Level:</strong> {llmPlan.assessment.currentLevel}</p>
              <div>
                <strong>Strengths:</strong>
                <ul>
                  {llmPlan.assessment.strengths?.map((strength: string, index: number) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Areas for Improvement:</strong>
                <ul>
                  {llmPlan.assessment.improvementAreas?.map((area: string, index: number) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {llmPlan.weeklyPlan && (
            <div style={{ marginBottom: '30px' }}>
              <h3>📅 Weekly Learning Plan</h3>
              {Object.entries(llmPlan.weeklyPlan).map(([weekKey, week]: [string, any]) => (
                <div key={weekKey} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <h4>{weekKey.toUpperCase()}: {week.focus}</h4>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Topics:</strong>
                    <ul>
                      {week.topics?.map((topic: string, index: number) => (
                        <li key={index}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Goals:</strong>
                    <ul>
                      {week.goals?.map((goal: string, index: number) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Project:</strong> {week.project}
                  </div>
                  
                  {week.resources && week.resources.length > 0 && (
                    <div>
                      <strong>Resources:</strong>
                      <ul>
                        {week.resources.map((resource: any, index: number) => (
                          <li key={index}>
                            {resource.title} ({resource.type}, {resource.duration}, {resource.difficulty})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {llmPlan.careerPath && (
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h3>🚀 Career Path</h3>
              <p><strong>Next Role:</strong> {llmPlan.careerPath.nextRole}</p>
              <p><strong>Salary Range:</strong> {llmPlan.careerPath.salaryRange}</p>
              <div>
                <strong>Required Skills:</strong>
                <ul>
                  {llmPlan.careerPath.requiredSkills?.map((skill: string, index: number) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '40px', fontSize: '12px', color: '#666' }}>
        <h3>🔍 Debug Info</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', fontSize: '10px' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}