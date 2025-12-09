"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  Award,
  Lightbulb,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Interfaces
interface BackendResponse {
  success: boolean;
  sessionId?: string;
  data?: {
    sessionId: string;
    session: {
      id: string;
      domain: {
        id: string;
        name: string;
        description?: string;
      };
      createdAt: string;
      status?: string;
    };
    baseRecommendation: {
      skills: any[];
      resources: any[];
      projects: any[];
      prerequisites?: any[];
    };
    llmRecommendation: {
      roadmap: string | object;
    };
    inferenceTrace?: any[];
  };
  // Legacy format support
  session?: {
    id: string;
    domain: {
      _id: string;
      name: string;
      description: string;
    };
    createdAt: string;
    status: string;
  };
  baseRecommendation?: {
    skills: any[];
    resources: any[];
    projects: any[];
    prerequisites: any[];
  };
  llmRecommendation?: {
    roadmap: string;
  };
  inferenceTrace?: any[];
}

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
  realTimeResources?: {
    [topic: string]: Array<{
      title: string;
      type: string;
      url?: string;
      provider?: string;
      difficulty?: string;
      thumbnail?: string;
      duration?: string;
    }>;
  };
}

// Premium Card Component (matching Dashboard)
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
const StatsCard = ({ icon: Icon, title, value, subtitle, color = "primary" }: { 
  icon: any; 
  title: string; 
  value: string; 
  subtitle?: string; 
  color?: "primary" | "secondary" | "success" | "warning" | "info"
}) => {
  const colorClasses: Record<string, string> = {
    primary: "from-primary/20 to-primary/10 text-primary shadow-primary/10",
    secondary: "from-muted to-muted/50 text-muted-foreground shadow-muted/10", 
    success: "from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10",
    warning: "from-orange-500/20 to-yellow-500/10 text-orange-600 dark:text-orange-400 shadow-orange-500/10",
    info: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 shadow-blue-500/10"
  };

  return (
    <GlowingCard className="p-6">
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
    </GlowingCard>
  );
};

export default function ResultPage() {
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [learningPath, setLearningPath] = useState<LLMLearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  useEffect(() => {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/results/test/${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('skillnavigator_token') || localStorage.getItem('token')}`
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch result: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 Backend response:', data);
        
        setBackendData(data);

        // Handle different response formats from backend
        let learningPathData = null;
        
        if (data.data?.roadmap) {
          // New format: data.data.roadmap
          learningPathData = data.data.roadmap;
        } else if (data.llmRecommendation?.roadmap) {
          // Legacy format: data.llmRecommendation.roadmap
          learningPathData = data.llmRecommendation.roadmap;
        } else if (data.data?.recommendation) {
          // Direct recommendation format
          learningPathData = data.data.recommendation;
        }

        if (learningPathData) {
          try {
            let parsed;
            if (typeof learningPathData === 'string') {
              parsed = JSON.parse(learningPathData);
              
              // Handle nested learningPath structure
              if (parsed.learningPath) {
                console.log('🔍 Found nested learningPath structure');
                const learningPath = parsed.learningPath;
                
                // Map to expected structure
                const mappedData = {
                  assessment: learningPath.assessment || {
                    currentLevel: "Beginner",
                    strengths: learningPath.strengths || [],
                    improvementAreas: learningPath.improvementAreas || []
                  },
                  weeklyPlan: learningPath.weeklyPlan || {},
                  careerPath: learningPath.careerPath || {
                    nextRole: "Junior Developer",
                    salaryRange: "$40k-60k", 
                    requiredSkills: learningPath.skills || []
                  },
                  milestones: learningPath.milestones || [],
                  realTimeResources: learningPath.realTimeResources || {}
                };
                
                setLearningPath(mappedData);
              } else {
                // Direct structure
                setLearningPath(parsed);
              }
            } else {
              setLearningPath(learningPathData);
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            setError('Failed to parse learning plan data: ' + (parseError as Error).message);
          }
        } else {
          setError('No AI-generated learning plan available for this session.');
        }
        
      } catch (err) {
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
          <Link href="/sessions">
            <Button>Back to Sessions</Button>
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
          {/* Premium Scrollbar Styles */}
          <style jsx global>{`
            .premium-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .premium-scrollbar::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.8);
              border-radius: 12px;
              margin: 4px;
            }
            .premium-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.6));
              border-radius: 12px;
              border: 2px solid transparent;
              background-clip: padding-box;
              transition: all 0.3s ease;
            }
            .premium-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, hsl(var(--primary) / 0.5), hsl(var(--primary) / 0.8));
              box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
              transform: scaleY(1.1);
            }
            .premium-scrollbar::-webkit-scrollbar-thumb:active {
              background: linear-gradient(180deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.9));
            }
            .premium-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: hsl(var(--primary) / 0.4) rgba(0, 0, 0, 0.8);
            }
          `}</style>
          
          {/* Premium animated background matching Dashboard */}
          <div className="absolute inset-0 bg-background">
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/4 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Brain className="h-8 w-8 text-primary animate-pulse" />
                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-75 animate-ping"></div>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    SkillNavigator
                  </span>
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
                {backendData.session?.domain?.name} Assessment Results
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(backendData.session?.createdAt || '').toLocaleDateString()}</span>
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
                title="Skills to Learn"
                value={Object.values(weeklyPlan || {}).reduce((acc: number, week: any) => acc + (week.topics?.length || 0), 0).toString()}
                subtitle="Identified for improvement"
                color="warning"
              />
              <StatsCard
                icon={CheckCircle}
                title="Resources"
                value={(() => {
                  // Count real-time resources
                  const realTimeResourcesCount = learningPath.realTimeResources ? 
                    Object.values(learningPath.realTimeResources).reduce((acc: number, resources: any) => acc + (resources?.length || 0), 0) : 0;
                  
                  // Fallback to week resources if no real-time resources
                  const weekResourcesCount = Object.values(weeklyPlan || {}).reduce((acc: number, week: any) => acc + (week.resources?.length || 0), 0);
                  
                  return Math.max(realTimeResourcesCount, weekResourcesCount).toString();
                })()}
                subtitle="Learning materials"
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
                      {assessment.strengths?.map((strength, index) => (
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
                      {assessment.improvementAreas?.map((area, index) => (
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

            {/* Weekly Learning Plan */}
            {weeklyPlan && Object.keys(weeklyPlan).length > 0 && (
              <GlowingCard className="mb-8 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Weekly Learning Plan</h2>
                    <p className="text-muted-foreground">Structured {Object.keys(weeklyPlan).length}-week roadmap</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {Object.entries(weeklyPlan)
                    .slice(0, showAllWeeks ? undefined : 4)
                    .map(([week, plan]: [string, any]) => (
                    <div key={week} className="border border-border/50 rounded-xl p-6 bg-card/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {week.replace('week', 'W')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{plan.focus}</h3>
                          <p className="text-sm text-muted-foreground">{plan.topics?.length || 0} topics • {plan.resources?.length || 0} resources</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-4 flex items-center text-lg">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/30 mr-3 shadow-sm">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              Topics to Learn
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {plan.topics?.map((topic: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-muted-foreground">{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-4 flex items-center text-lg">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 mr-3 shadow-sm">
                              <ExternalLink className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              Learning Resources
                            </span>
                          </h4>
                          
                          {(() => {
                            // Get all real-time resources for this week's topics
                            const allTopicResources = plan.topics ? 
                              plan.topics.flatMap((topic: string) => {
                                const resources = learningPath.realTimeResources?.[topic] || [];
                                return resources;
                              }) : [];
                            
                            // Group resources by type
                            const groupedResources = allTopicResources.reduce((acc: any, resource: any) => {
                              const type = resource.type || 'other';
                              if (!acc[type]) acc[type] = [];
                              acc[type].push(resource);
                              return acc;
                            }, {});

                            // Premium Resource type configurations
                            const resourceTypeConfig = {
                              video: { label: '🎥 Videos', color: 'bg-gradient-to-r from-red-500/10 to-red-600/20 text-red-600 border-red-500/30 hover:from-red-500/20 hover:to-red-600/30' },
                              course: { label: '📚 Courses', color: 'bg-gradient-to-r from-blue-500/10 to-blue-600/20 text-blue-600 border-blue-500/30 hover:from-blue-500/20 hover:to-blue-600/30' },
                              tutorial: { label: '📖 Tutorials', color: 'bg-gradient-to-r from-green-500/10 to-green-600/20 text-green-600 border-green-500/30 hover:from-green-500/20 hover:to-green-600/30' },
                              project: { label: '🛠️ Projects', color: 'bg-gradient-to-r from-purple-500/10 to-purple-600/20 text-purple-600 border-purple-500/30 hover:from-purple-500/20 hover:to-purple-600/30' },
                              documentation: { label: '📋 Docs', color: 'bg-gradient-to-r from-orange-500/10 to-orange-600/20 text-orange-600 border-orange-500/30 hover:from-orange-500/20 hover:to-orange-600/30' }
                            };

                            if (Object.keys(groupedResources).length > 0) {
                              // Get the selected resources to display
                              const resourcesToShow = selectedResourceType === 'all' 
                                ? Object.values(groupedResources).flat() 
                                : groupedResources[selectedResourceType] || [];

                              return (
                                <div className="space-y-4">
                                  {/* Premium Filter Tabs */}
                                  <div className="flex flex-wrap gap-2 mb-1">
                                    <button
                                      onClick={() => setSelectedResourceType('all')}
                                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 transform hover:scale-105 ${
                                        selectedResourceType === 'all' 
                                          ? 'bg-gradient-to-r from-primary/20 to-primary/30 text-primary border-primary/40 shadow-lg shadow-primary/20' 
                                          : 'bg-gradient-to-r from-slate-500/5 to-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20 hover:from-slate-500/10 hover:to-slate-500/20 hover:shadow-md'
                                      }`}
                                    >
                                      All ({Object.values(groupedResources).flat().length})
                                    </button>
                                    {Object.entries(groupedResources).map(([type, resources]: [string, any]) => (
                                      <button
                                        key={type}
                                        onClick={() => setSelectedResourceType(type)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                          selectedResourceType === type 
                                            ? resourceTypeConfig[type as keyof typeof resourceTypeConfig]?.color.replace('hover:', '').replace('bg-', 'bg-').replace('/10', '/20') + ' ring-1 ring-current/20'
                                            : resourceTypeConfig[type as keyof typeof resourceTypeConfig]?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20'
                                        }`}
                                      >
                                        {resourceTypeConfig[type as keyof typeof resourceTypeConfig]?.label || `📎 ${type.charAt(0).toUpperCase() + type.slice(1)}`} ({resources.length})
                                      </button>
                                    ))}
                                  </div>

                                  {/* Resources in Premium Column Layout */}
                                  <div 
                                    className="premium-scrollbar grid gap-4 max-h-80 overflow-y-auto pr-3 pl-1"
                                    style={{
                                      scrollbarWidth: 'thin',
                                      scrollbarColor: 'hsl(var(--primary) / 0.4) rgba(0, 0, 0, 0.8)',
                                    }}
                                  >
                                    {resourcesToShow.map((resource: any, idx: number) => (
                                      <div key={idx} className="group flex items-start space-x-4 p-4 bg-gradient-to-r from-card/60 to-card/40 rounded-xl border border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 backdrop-blur-sm">
                                        <div className="w-20 h-14 flex-shrink-0">
                                          {resource.thumbnail ? (
                                            <img 
                                              src={resource.thumbnail} 
                                              alt={resource.title}
                                              className="w-full h-full object-cover rounded-lg border-2 border-border/30 group-hover:border-primary/30 shadow-sm group-hover:shadow-md transition-all duration-300"
                                              onError={(e) => { 
                                                e.currentTarget.style.display = 'none';
                                                (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                              }}
                                            />
                                          ) : null}
                                          <div 
                                            className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border-2 border-primary/20 flex items-center justify-center"
                                            style={{ display: resource.thumbnail ? 'none' : 'flex' }}
                                          >
                                            <BookOpen className="h-6 w-6 text-primary/60" />
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h6 className="font-medium text-sm text-foreground mb-1" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                          }}>{resource.title}</h6>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                              {resource.provider && (
                                                <span className="text-xs px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/20 text-primary rounded-full border border-primary/20 font-medium">
                                                  {resource.provider}
                                                </span>
                                              )}
                                              {resource.difficulty && (
                                                <span className="text-xs text-muted-foreground">
                                                  {resource.difficulty}
                                                </span>
                                              )}
                                            </div>
                                            {resource.url && resource.url !== '#' ? (
                                              <a 
                                                href={resource.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary rounded-lg text-xs font-semibold transition-all duration-300 hover:shadow-md hover:scale-105 border border-primary/20"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                                <span>Open</span>
                                              </a>
                                            ) : (
                                              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">
                                                Available
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {resourcesToShow.length === 0 && (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No {selectedResourceType} resources available</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            // Fallback to original resources if no real-time resources
                            return plan.resources?.map((resource: any, index: number) => (
                              <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/30">
                                <h5 className="font-medium text-sm mb-2">{resource.title}</h5>
                                <div className="flex items-center space-x-2">
                                  <PremiumBadge variant="default" className="text-xs">
                                    {resource.type}
                                  </PremiumBadge>
                                  <span className="text-xs text-muted-foreground">{resource.duration}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                      
                      {/* {plan.project && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                          <h4 className="font-medium mb-2 flex items-center text-primary">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Week Project
                          </h4>
                          <p className="text-sm text-muted-foreground">{plan.project}</p>
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
                
                {/* Show More/Less Button */}
                {Object.keys(weeklyPlan).length > 4 && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={() => setShowAllWeeks(!showAllWeeks)}
                      variant="outline"
                      className="bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 border-primary/30 text-primary hover:text-primary"
                    >
                      {showAllWeeks ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Show Less Weeks
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Show All {Object.keys(weeklyPlan).length} Weeks
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </GlowingCard>
            )}

            {/* Career Path & Milestones */}
            {careerPath && (
              <GlowingCard className="mb-8 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Career Path</h2>
                    <p className="text-muted-foreground">Your next steps and opportunities</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Next Role</h3>
                    <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/5 rounded-lg border border-emerald-500/20">
                      <h4 className="font-medium text-emerald-600 dark:text-emerald-400">{careerPath.nextRole}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{careerPath.salaryRange}</p>
                    </div>
                    
                    <h4 className="font-medium mt-4 mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {careerPath.requiredSkills?.map((skill: string, index: number) => (
                        <PremiumBadge key={index} variant="skill" className="text-xs">
                          {skill}
                        </PremiumBadge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {milestones?.map((milestone: any, index: number) => (
                        <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {milestone.week}
                            </div>
                            <span className="font-medium text-sm">Week {milestone.week}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{milestone.project}</p>
                          <div className="flex flex-wrap gap-1">
                            {milestone.skills?.slice(0, 3).map((skill: string, skillIndex: number) => (
                              <PremiumBadge key={skillIndex} variant="default" className="text-xs">
                                {skill}
                              </PremiumBadge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowingCard>
            )}

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href="/sessions">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Sessions
                  </Button>
                </Link>
                <Link href={`/questionnaire/${backendData.session?.domain?._id}`}>
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
