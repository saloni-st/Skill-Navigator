"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  Star,
  ArrowLeft,
  AlertCircle,
  Trophy,
  Zap,
  Sparkles,
  ArrowRight,
  BarChart3,
  Award,
  Users,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Premium Card Component with glass morphism (matching Dashboard)
const GlowingCard = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div 
    className={cn(
      "relative group",
      "bg-card border border-border/50",
      "rounded-xl shadow-lg",
      "hover:shadow-xl hover:shadow-primary/5",
      "transition-all duration-500 ease-out",
      "hover:scale-[1.01] hover:border-border",
      "before:absolute before:inset-0 before:rounded-xl",
      "before:bg-gradient-to-r before:from-primary/5 before:via-primary/5 before:to-primary/5",
      "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
      className
    )}
    {...props}
  >
    <div className="relative z-10">
      {children}
    </div>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-primary/10 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500 -z-10" />
  </div>
);

// Premium badge component (matching Dashboard)
const PremiumBadge = ({ children, variant = "default", className, ...props }: { 
  children: React.ReactNode; 
  variant?: "premium" | "skill" | "achievement" | "default"; 
  className?: string; 
  [key: string]: any 
}) => (
  <div className="relative group">
    <Badge 
      className={cn(
        "relative overflow-hidden border-0 font-medium",
        "transition-all duration-300 hover:scale-105",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-200%] group-hover:before:translate-x-[200%]",
        "before:transition-transform before:duration-700 before:ease-out",
        variant === "premium" && "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg shadow-yellow-500/20",
        variant === "skill" && "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20",
        variant === "achievement" && "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20",
        variant === "default" && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  </div>
);

// Stat card component (matching Dashboard)
const StatsCard = ({ icon: Icon, title, value, subtitle, trend, color = "primary" }: { 
  icon: any; 
  title: string; 
  value: string; 
  subtitle?: string; 
  trend?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "info"
}) => {
  const colorClasses = {
    primary: "from-primary/20 to-primary/10 text-primary shadow-primary/10",
    secondary: "from-muted to-muted/50 text-muted-foreground shadow-muted/10", 
    success: "from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10",
    warning: "from-orange-500/20 to-yellow-500/10 text-orange-600 dark:text-orange-400 shadow-orange-500/10",
    info: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 shadow-blue-500/10"
  };

  return (
    <GlowingCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <PremiumBadge variant="achievement" className="text-xs">
              {trend}
            </PremiumBadge>
          </div>
        )}
      </div>
    </GlowingCard>
  );
};

// Interface matching exact backend output
interface BackendResponse {
  success: boolean;
  sessionId: string;
  session: {
    id: string;
    domain: {
      _id: string;
      name: string;
      description: string;
    };
    createdAt: string;
    status: string;
  };
  baseRecommendation: {
    skills: any[];
    resources: any[];
    projects: any[];
    prerequisites: any[];
  };
  llmRecommendation: {
    roadmap: string; // JSON string that needs parsing
  };
  inferenceTrace: any[];
}

// Interface for parsed LLM data
interface LLMLearningPath {
  assessment: {
    currentLevel: string;
    strengths: string[];
    improvementAreas: string[];
  };
  weeklyPlan: {
    [key: string]: {
      focus: string;
      topics: string[];
      dailySchedule: {
        [day: string]: string;
      };
      resources: Array<{
        title: string;
        type: string;
        duration: string;
        difficulty: string;
      }>;
      project: string;
      goals: string[];
    };
  };
  careerPath: {
    nextRole: string;
    salaryRange: string;
    requiredSkills: string[];
  };
  milestones: Array<{
    week: number;
    project: string;
    skills: string[];
  }>;
}

export default function ResultPage() {
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [learningPath, setLearningPath] = useState<LLMLearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session ID from URL
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/');
      const id = pathSegments[pathSegments.length - 1];
      setSessionId(id);
    }
  }, []);

  useEffect(() => {
    const fetchResult = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/sessions/${sessionId}/result`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch result: ${response.statusText}`);
        }

        const data: BackendResponse = await response.json();
        console.log('Backend data:', data);
        setBackendData(data);

        // Parse LLM roadmap if available
        if (data.llmRecommendation?.roadmap) {
          try {
            const parsed = JSON.parse(data.llmRecommendation.roadmap);
            console.log('Parsed LLM data:', parsed);
            setLearningPath(parsed);
          } catch (parseError) {
            console.error('❌ Failed to parse LLM roadmap:', parseError);
            setError('Failed to parse learning plan data');
          }
        } else {
          console.log('❌ No LLM roadmap data available');
          setError('No AI-generated learning plan available for this session. Only LLM recommendations are supported.');
        }
        
      } catch (err) {
        console.error('💥 Error loading result:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading AI-generated learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !backendData || !learningPath) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No AI Learning Path Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'This session doesn\'t have AI-generated recommendations yet.'}
          </p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { assessment, weeklyPlan, careerPath, milestones } = learningPath;

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <div className="min-h-screen bg-background relative overflow-hidden">
          {/* Premium animated background matching Dashboard */}
          <div className="absolute inset-0 bg-background">
            {/* Animated orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/4 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Brain className="h-8 w-8 text-primary animate-pulse" />
                      <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-75 animate-ping"></div>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      SkillNavigator
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/sessions">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Sessions
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Premium Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 mb-4">
                
              </div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Learning Path Analysis
                </span>
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                {backendData.session.domain.name} Assessment Results
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(backendData.session.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <Brain className="h-4 w-4" />
                  <span>Session: {sessionId}</span>
                </div>
              </div>
            </div>

            {/* Stats Overview - Dashboard Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                icon={Target}
                title="Current Level"
                value={assessment?.currentLevel || "Beginner"}
                subtitle="Skill Assessment"
                color="primary"
              />
              <StatsCard
                icon={TrendingUp}
                title="Growth Areas"
                value={assessment?.improvementAreas?.length.toString() || "0"}
                subtitle="Identified for improvement"
                color="warning"
              />
              <StatsCard
                icon={CheckCircle}
                title="Strengths"
                value={assessment?.strengths?.length.toString() || "0"}
                subtitle="Key competencies"
                color="success"
              />
              <StatsCard
                icon={Calendar}
                title="Learning Weeks"
                value={Object.keys(weeklyPlan || {}).length.toString()}
                subtitle="Structured plan"
                color="info"
              />
            </div>

            {/* Assessment Section - Premium Style */}
            {assessment && (
              <GlowingCard className="mb-8 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/10">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Assessment Results</h2>
                    <p className="text-muted-foreground">Comprehensive skill analysis</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="relative mx-auto w-24 h-24 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                        <span className="text-2xl font-bold text-white">
                          {assessment.currentLevel?.charAt(0).toUpperCase() || 'B'}
                        </span>
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-primary/50 to-primary/30 rounded-full blur opacity-75"></div>
                    </div>
                    <h3 className="font-semibold mb-1">Current Level</h3>
                    <PremiumBadge variant="skill" className="text-xs capitalize">
                      {assessment.currentLevel}
                    </PremiumBadge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      Strengths ({assessment.strengths?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {assessment.strengths?.map((strength: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Improvement Areas ({assessment.improvementAreas?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {assessment.improvementAreas?.map((area: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowingCard>
            )}

            {/* Weekly Learning Plan - Premium Style */}
            {weeklyPlan && Object.keys(weeklyPlan).length > 0 && (
              <GlowingCard className="mb-8 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Weekly Learning Plan</h2>
                    <p className="text-muted-foreground">
                      {Object.keys(weeklyPlan).length}-week structured roadmap
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {Object.entries(weeklyPlan).map(([weekKey, week], index) => (
                    <GlowingCard key={weekKey} className="p-5 border border-border/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{week.focus}</h3>
                            <PremiumBadge variant="skill" className="text-xs mt-1">
                              {weekKey.toUpperCase()}
                            </PremiumBadge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Topics */}
                        {week.topics && week.topics.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-primary" />
                              Key Topics ({week.topics.length})
                            </h4>
                            <div className="space-y-2">
                              {week.topics.map((topic: string, topicIndex: number) => (
                                <div key={topicIndex} className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  <span className="text-sm text-muted-foreground">{topic}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Goals */}
                        {week.goals && week.goals.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center">
                              <Target className="h-4 w-4 mr-2 text-emerald-500" />
                              Learning Goals ({week.goals.length})
                            </h4>
                            <div className="space-y-2">
                              {week.goals.map((goal: string, goalIndex: number) => (
                                <div key={goalIndex} className="flex items-start space-x-2">
                                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground">{goal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Project */}
                      {/* {week.project && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/20">
                          <h4 className="font-semibold text-sm mb-2 flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                            Week Project
                          </h4>
                          <p className="text-sm text-muted-foreground">{week.project}</p>
                        </div>
                      )} */}

                      {/* Resources */}
                      {week.resources && week.resources.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-sm mb-3 flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                            Learning Resources ({week.resources.length})
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {week.resources.map((resource: any, resIndex: number) => (
                              <div key={resIndex} className="p-3 bg-muted/20 rounded-lg border border-border/10">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-sm">{resource.title}</h5>
                                  <PremiumBadge variant="default" className="text-xs">
                                    {resource.type}
                                  </PremiumBadge>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{resource.duration}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <BarChart3 className="h-3 w-3" />
                                    <span>{resource.difficulty}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </GlowingCard>
                  ))}
                </div>
              </GlowingCard>
            )}

            {/* Career Path & Next Steps - Premium Style */}
            {careerPath && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <GlowingCard className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Career Path</h3>
                      <p className="text-muted-foreground text-sm">AI-predicted trajectory</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                        Next Role
                      </h4>
                      <PremiumBadge variant="premium" className="text-sm">
                        {careerPath.nextRole}
                      </PremiumBadge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-green-500" />
                        Salary Range
                      </h4>
                      <p className="text-muted-foreground">{careerPath.salaryRange}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Star className="h-4 w-4 mr-2 text-blue-500" />
                        Required Skills ({careerPath.requiredSkills?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {careerPath.requiredSkills?.map((skill: string, index: number) => (
                          <PremiumBadge key={index} variant="skill" className="text-xs">
                            {skill}
                          </PremiumBadge>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlowingCard>

                {/* Milestones */}
                {milestones && milestones.length > 0 && (
                  <GlowingCard className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/10">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Learning Milestones</h3>
                        <p className="text-muted-foreground text-sm">Achievement roadmap</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {milestones.slice(0, 4).map((milestone: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {milestone.week}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm mb-1">{milestone.project}</h5>
                            <div className="flex flex-wrap gap-1">
                              {milestone.skills?.slice(0, 3).map((skill: string, skillIndex: number) => (
                                <span key={skillIndex} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlowingCard>
                )}
              </div>
            )}

            {/* Action Buttons - Premium Style */}
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href="/sessions">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Sessions
                  </Button>
                </Link>
                <Link href={`/questionnaire/${backendData.session.domain._id}`}>
                  <Button variant="outline" size="lg" className="border-border hover:bg-muted group">
                    <Brain className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Retake Assessment
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Generated based on your assessment responses
              </p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}