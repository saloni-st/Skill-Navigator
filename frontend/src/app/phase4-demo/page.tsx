"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shuffle } from "lucide-react";
import Link from "next/link";
import { EnhancedResultView } from "@/components/result/EnhancedResultView";
import { ProcessingView } from "@/components/result/ProcessingView";
import { EnhancedResult } from "@/types/api";

// Demo data for Phase 4 testing
const generateDemoResult = (profile: 'success' | 'failed' | 'low_confidence' | 'processing'): EnhancedResult | null => {
  if (profile === 'processing') return null;

  const baseResult = {
    sessionId: 'demo-session-' + profile,
    session: {
      id: 'demo-session-' + profile,
      domain: {
        id: 'web-dev',
        name: 'Web Development'
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    },
    baseRecommendation: {
      summary: "Based on your profile as a beginner with some college experience, we recommend starting with HTML/CSS fundamentals before moving to JavaScript. Focus on hands-on projects to build your portfolio.",
      recommendations: [
        "Master HTML & CSS Fundamentals",
        "Learn JavaScript Basics",
        "Build Portfolio Projects",
        "Practice Responsive Design",
        "Learn Version Control (Git)"
      ],
      difficulty: 'beginner' as const,
      estimatedTimeframe: "6-8 months",
      recommendedPath: [
        "HTML/CSS Fundamentals",
        "JavaScript Basics", 
        "Responsive Design",
        "React Introduction",
        "Portfolio Projects"
      ],
      ruleMatches: [
        {
          ruleId: 'r1',
          description: 'Beginner path for new developers',
          weight: 0.9,
          matched: true,
          condition: "experience == 'beginner'",
          recommendation: "Start with fundamentals"
        },
        {
          ruleId: 'r2',
          description: 'College education boost',
          weight: 0.7,
          matched: true,
          condition: "education == 'some_college'",
          recommendation: "Structured learning approach"
        }
      ]
    },
    confidence: profile === 'low_confidence' ? 0.45 : (profile === 'success' ? 0.82 : 0.75),
    confidenceBreakdown: {
      totalPositive: profile === 'low_confidence' ? 0.45 : (profile === 'success' ? 0.82 : 0.75),
      coverage: profile === 'low_confidence' ? 0.6 : 0.85,
      breakdown: [
        {
          ruleId: 'r1',
          ruleName: 'Beginner friendly path',
          score: 0.9,
          weight: 0.8,
          matched: true
        },
        {
          ruleId: 'r2', 
          ruleName: 'Education level match',
          score: 0.7,
          weight: 0.6,
          matched: true
        },
        {
          ruleId: 'r3',
          ruleName: 'Time commitment analysis',
          score: profile === 'low_confidence' ? 0.3 : 0.8,
          weight: 0.7,
          matched: profile !== 'low_confidence'
        }
      ]
    },
    trace: [
      {
        step: 'fact_normalization',
        description: 'Normalized user questionnaire answers into structured facts',
        result: 'Successfully processed 8 questionnaire fields'
      },
      {
        step: 'rule_matching',
        description: 'Matched user profile against 15 available rules',
        result: `Found ${profile === 'low_confidence' ? 2 : 4} matching rules`
      },
      {
        step: 'confidence_calculation', 
        description: 'Calculated overall confidence based on rule matches and coverage',
        result: `Confidence: ${profile === 'low_confidence' ? '45%' : (profile === 'success' ? '82%' : '75%')}`
      }
    ],
    llmStatus: profile as any,
    processing: {
      totalSteps: 2,
      completedSteps: 2,
      currentStep: 'completed',
      stepDetails: [
        {
          step: 1,
          name: 'Inference Engine',
          status: 'completed' as const,
          duration: '245ms'
        },
        {
          step: 2,
          name: 'LLM Refinement', 
          status: profile === 'success' ? 'completed' : (profile === 'failed' ? 'failed' : 'skipped'),
          duration: profile === 'success' ? '1.2s' : (profile === 'failed' ? '5.0s (timeout)' : 'N/A')
        }
      ]
    },
    actions: {
      canSave: true,
      canDownload: true,
      canClarify: profile === 'success',
      canRate: true
    }
  };

  // Add LLM recommendation for success case
  if (profile === 'success') {
    (baseResult as any).llmRecommendation = {
      roadmap: [
        {
          phase: "Month 1-2: Foundation Building",
          duration: "2 months",
          description: "Master the building blocks of web development with hands-on practice",
          skills: ["HTML5 semantics", "CSS Grid & Flexbox", "Responsive design", "Git basics"],
          milestones: ["Build 3 static websites", "Create responsive portfolio template", "Learn CSS animations"],
          resources: [
            { type: "course", title: "FreeCodeCamp HTML/CSS", free: true },
            { type: "book", title: "HTML & CSS by Jon Duckett" }
          ]
        },
        {
          phase: "Month 3-4: Adding Interactivity",
          duration: "2 months", 
          description: "Learn JavaScript fundamentals and make your websites interactive",
          skills: ["JavaScript basics", "DOM manipulation", "Event handling", "ES6+ features"],
          milestones: ["Build interactive web apps", "Create form validation", "Implement local storage"],
          resources: [
            { type: "course", title: "JavaScript30", free: true },
            { type: "book", title: "Eloquent JavaScript" }
          ]
        },
        {
          phase: "Month 5-6: Modern Development",
          duration: "2 months",
          description: "Dive into React and modern development workflows", 
          skills: ["React components", "State management", "Props and hooks", "API integration"],
          milestones: ["Build React todo app", "Create weather application", "Implement routing"],
          resources: [
            { type: "course", title: "React Documentation", free: true },
            { type: "course", title: "Complete React Developer Course" }
          ]
        }
      ],
      llmStatus: 'success'
    };
  }

  return baseResult as EnhancedResult;
};

const processingStates = [
  { currentStep: 1, totalSteps: 2, stepName: "Running inference", status: 'running' as const },
  { currentStep: 2, totalSteps: 2, stepName: "Refining with AI", status: 'running' as const },
];

export default function Phase4DemoPage() {
  const [currentProfile, setCurrentProfile] = useState<'success' | 'failed' | 'low_confidence' | 'processing'>('success');
  const [processingStep, setProcessingStep] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const result = generateDemoResult(currentProfile);

  const handleProfileChange = (profile: 'success' | 'failed' | 'low_confidence' | 'processing') => {
    setCurrentProfile(profile);
    setProcessingStep(0);
  };

  const handleRetryLlm = async () => {
    setIsRetrying(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsRetrying(false);
      setCurrentProfile('success'); // Simulate successful retry
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Badge variant="secondary">Phase 4 Demo</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProfileChange('success')}
                className={currentProfile === 'success' ? 'bg-green-100' : ''}
              >
                LLM Success
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => handleProfileChange('failed')}
                className={currentProfile === 'failed' ? 'bg-red-100' : ''}
              >
                LLM Failed
              </Button>
              <Button
                variant="outline"
                size="sm" 
                onClick={() => handleProfileChange('low_confidence')}
                className={currentProfile === 'low_confidence' ? 'bg-yellow-100' : ''}
              >
                Low Confidence
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProfileChange('processing')}
                className={currentProfile === 'processing' ? 'bg-blue-100' : ''}
              >
                Processing
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Phase 4 Demo: Enhanced Result Display
          </h1>
          <p className="text-muted-foreground">
            Demonstrating robust UI behavior for different LLM states and confidence levels
          </p>
        </div>

        {/* Current State Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Demo State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Features Being Demonstrated:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ LLM Status Indicators (Success/Failed/Not Used)</li>
                  <li>✅ Confidence Pills with Breakdown</li>
                  <li>✅ Fallback Banners for Failed LLM</li>
                  <li>✅ Low Confidence Warnings</li>
                  <li>✅ Toggle between LLM and Rule-based Views</li>
                  <li>✅ Retry LLM Functionality</li>
                  <li>✅ Processing Progress with Step Tracking</li>
                  <li>✅ Admin Debug View (simulated)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Phase 4 Acceptance Criteria:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ UI reflects llmStatus correctly for all scenarios</li>
                  <li>✅ Admin debug shows raw session JSON</li>
                  <li>✅ Retry button triggers refinement and updates UI</li>
                  <li>✅ Confidence breakdown expands when clicked</li>
                  <li>✅ Rule trace corresponds to matched rules</li>
                  <li>✅ Processing steps show clear progress indication</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing View */}
        {currentProfile === 'processing' && (
          <ProcessingView 
            processing={processingStates[processingStep]}
            onCancel={() => handleProfileChange('success')}
          />
        )}

        {/* Enhanced Result View */}
        {result && (
          <EnhancedResultView
            result={result}
            onRetryLlm={handleRetryLlm}
            isRetrying={isRetrying}
            isAdmin={true} // Show admin features for demo
          />
        )}
      </main>
    </div>
  );
}