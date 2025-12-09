"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAsyncState } from "@/hooks/useAsyncState";
import { 
  Brain, 
  Calendar, 
  TrendingUp, 
  Clock,
  ArrowRight,
  BarChart3,
  Trash2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Star,
  Trophy,
  Target,
  Zap,
  Sparkles,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserNavigation from "@/components/navigation/UserNavigation";
import { sessionsAPI } from "@/lib/api";
import { toast } from "sonner";

// Premium Card Component with glass morphism
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

// Premium badge component
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

// Stat card component
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
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="flex items-center text-emerald-500 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </div>
    </GlowingCard>
  );
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return "text-green-600 bg-green-50";
  if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

const getLevelColor = (level?: string) => {
  if (!level) return "bg-gray-100 text-gray-800";
  
  switch (level.toLowerCase()) {
    case "expert": return "bg-purple-100 text-purple-800";
    case "advanced": return "bg-blue-100 text-blue-800";
    case "intermediate": return "bg-green-100 text-green-800";
    case "beginner": return "bg-yellow-100 text-yellow-800";
    case "novice": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

function SessionsContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      try {
        const response = await sessionsAPI.getUserSessions();
        if (response?.success && response?.data?.sessions) {
          console.log('Sessions from backend:', response.data.sessions);
          setSessions(response.data.sessions);
          return;
        }
      } catch (error) {
        console.warn('Could not fetch sessions from backend:', error);
      }
      
      // Fallback to localStorage
      try {
        const savedResults = localStorage.getItem('saved_results');
        if (savedResults) {
          const localSessions = JSON.parse(savedResults);
          console.log('Sessions from localStorage:', localSessions);
          if (Array.isArray(localSessions) && localSessions.length > 0) {
            // Transform localStorage format to match backend format
            const transformedSessions = localSessions.map(result => ({
              id: result.sessionId || result.id,
              domain: { name: result.domainName || result.domain?.name || 'Unknown Domain' },
              status: 'completed', // localStorage results are completed
              answersCount: result.answersCount || 0,
              confidence: result.confidence || (result.answersCount > 0 ? 1 : 0.8), // 100% if questions answered, otherwise 80%
              createdAt: result.createdAt || new Date().toISOString(),
              updatedAt: result.updatedAt || result.createdAt || new Date().toISOString(),
              hasRecommendation: true,
              hasLLMRefinement: false
            }));
            console.log('Transformed localStorage sessions:', transformedSessions);
            setSessions(transformedSessions);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not load from localStorage:', error);
      }
      
      // If no data from anywhere, use empty array
      console.log('No sessions found, using empty array');
      setSessions([]);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Try to delete from backend first
      try {
        const response = await sessionsAPI.deleteSession(sessionId);
        if (response.success) {
          toast.success("Session deleted successfully from database");
        }
      } catch (error) {
        console.warn('Could not delete from backend:', error);
        toast.warning("Could not delete from server, but removed from local storage");
      }
      
      // Remove from localStorage as backup
      const savedResults = JSON.parse(localStorage.getItem('saved_results') || '[]');
      const filteredResults = savedResults.filter((result: any) => result.id !== sessionId && result.sessionId !== sessionId);
      localStorage.setItem('saved_results', JSON.stringify(filteredResults));
      
      // Update state immediately for better UX - NO PAGE RELOAD
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Reset deleting state
      setDeletingSessionId(null);
      
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error("Failed to delete session completely");
      setDeletingSessionId(null);
    }
  };

  const toggleDeleteConfirm = (sessionId: string) => {
    if (deletingSessionId === sessionId) {
      setDeletingSessionId(null);
    } else {
      setDeletingSessionId(sessionId);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === "all") return true;
    if (!session.domain?.name || !filter) return false;
    return session.domain.name.toLowerCase().includes(filter.toLowerCase());
  });

  const getDomainOptions = () => {
    const domains = [...new Set(sessions.map(s => s.domain?.name).filter(Boolean))];
    return domains;
  };

  // Calculate real stats from sessions data
  const getStats = () => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        domainsExplored: 0,
        successRate: "0%",
        averageScore: "0%",
        averageConfidence: "0%",
        totalQuestions: 0,
        lastAssessmentDate: "Never"
      };
    }

    const totalSessions = sessions.length;
    const domainsExplored = getDomainOptions().length;
    const successRate = "100%"; // All retrieved sessions are completed
    
    // Backend doesn't send overallScore, so calculate completion rate instead
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const completionRate = Math.round((completedSessions / totalSessions) * 100);
    
    const averageConfidence = sessions.length > 0 
      ? Math.round(sessions.reduce((acc, s) => {
          const confidence = s.confidence || 0;
          // If confidence is 0, use 100% (all questions answered means full confidence)
          if (confidence === 0 && s.answersCount > 0) {
            return acc + 100;
          }
          return acc + (confidence * 100);
        }, 0) / sessions.length)
      : 0;

    const totalQuestions = sessions.reduce((acc, s) => acc + (s.answersCount || 0), 0);

    const lastAssessmentDate = sessions.length > 0 
      ? new Date(sessions[0].updatedAt || sessions[0].createdAt).toLocaleDateString()
      : "Never";

    return {
      totalSessions,
      domainsExplored,
      successRate: `${completionRate}%`,
      averageScore: `${averageConfidence}%`, // Using confidence as score proxy
      averageConfidence: `${averageConfidence}%`,
      totalQuestions,
      lastAssessmentDate
    };
  };

  const stats = getStats();

  // Helper function for confidence calculation
  const getConfidenceScore = (session: any) => {
    const confidence = session.confidence || 0;
    // If confidence is 0, calculate from answersCount as 100% (all questions answered)
    if (confidence === 0 && session.answersCount > 0) {
      return 100; // All answered questions means 100% confidence
    }
    return Math.round(confidence * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />
        
        <div className="text-center relative z-10">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-xl font-medium text-foreground">
            Loading your assessment history...
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/2 rounded-full blur-2xl animate-pulse delay-500 -z-10" />

      {/* Navigation */}
      <UserNavigation />

      {/* Page Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center space-x-2 group">
                <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Assessment History
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <PremiumBadge variant="premium" className="text-sm">
              <Trophy className="w-4 h-4 mr-1" />
              Your Journey
            </PremiumBadge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Assessment History
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your learning progress and revisit your assessment results
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={BarChart3}
            title="Total Assessments"
            value={stats.totalSessions.toString()}
            subtitle="Completed assessments"
            color="primary"
          />
          
          <StatsCard
            icon={Brain}
            title="Domains Explored"
            value={stats.domainsExplored.toString()}
            subtitle="Different skill areas"
            color="info"
          />
          
          <StatsCard
            icon={Target}
            title="Average Score"
            value={stats.averageScore}
            subtitle="Across all assessments"
            color="success"
          />
          
          <StatsCard
            icon={Zap}
            title="Total Questions"
            value={stats.totalQuestions.toString()}
            subtitle="Questions answered"
            color="warning"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-sm font-medium text-muted-foreground">Filter by domain:</span>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({stats.totalSessions})
            </Button>
            {getDomainOptions().map((domain, index) => (
              <Button
                key={domain || `domain-${index}`}
                variant={filter === domain ? "default" : "outline"}
                size="sm" 
                onClick={() => setFilter(domain)}
              >
                {domain} ({sessions.filter(s => s.domain?.name === domain).length})
              </Button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <GlowingCard className="text-center py-16">
            <div className="relative">
              <Brain className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  No Sessions Found
                </span>
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                {filter === "all" 
                  ? "Start your learning journey with your first assessment" 
                  : `No assessments found for ${filter} domain`
                }
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Take Your First Assessment
                </Button>
              </Link>
            </div>
          </GlowingCard>
        ) : (
          <div className="grid gap-6">
            {filteredSessions.map((session, index) => (
              <GlowingCard key={session.id || `session-${index}`} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
                        <Brain className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-foreground">
                          {session.domain?.name || "Unknown Domain"}
                        </h3>
                        <PremiumBadge variant="skill">
                          {session.status === 'completed' ? 'Completed' : 'In Progress'}
                        </PremiumBadge>
                        <PremiumBadge variant="achievement">
                          <Trophy className="w-3 h-3 mr-1" />
                          {getConfidenceScore(session)}%
                        </PremiumBadge>
                      </div>
                      
                      <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {session.updatedAt || session.createdAt
                              ? new Date(session.updatedAt || session.createdAt).toLocaleDateString()
                              : "Unknown Date"
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>{session.answersCount || 0} questions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">
                            {getConfidenceScore(session)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Delete confirmation slide */}
                    <div className="flex items-center space-x-2">
                      {deletingSessionId === session.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 animate-in slide-in-from-left-3"
                          title="Confirm delete"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDeleteConfirm(session.id)}
                        className={cn(
                          "text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 group",
                          deletingSessionId === session.id && "text-red-500 bg-red-500/10"
                        )}
                        title={deletingSessionId === session.id ? "Cancel delete" : "Delete this assessment session permanently"}
                      >
                        {deletingSessionId === session.id ? (
                          <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        )}
                      </Button>
                    </div>
                    
                    <Link href={`/result/${session.id}`}>
                      <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group">
                        View Results
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </GlowingCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <SessionsContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}