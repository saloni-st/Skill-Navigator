  "use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { Brain, Code2, Shield, TrendingUp, User, LogOut, Settings, Clock, AlertCircle, RefreshCw, Star, Sparkles, Trophy, Target, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserNavigation from "@/components/navigation/UserNavigation";
import { domainsAPI, sessionsAPI } from "@/lib/api";
import { Domain, Session } from "@/types/api";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch available domains with error handling
        try {
          const domainsResponse = await domainsAPI.getAll();
          if (domainsResponse?.success && domainsResponse?.data?.domains) {
            setDomains(domainsResponse.data.domains);
          } else {
            console.warn('No domains data received:', domainsResponse);
            setDomains([]);
          }
        } catch (domainError) {
          console.error('Error fetching domains:', domainError);
          setDomains([]);
        }

        // Fetch user sessions with error handling
        try {
          const sessionsResponse = await sessionsAPI.getUserSessions();
          if (sessionsResponse?.success && sessionsResponse?.data?.sessions) {
            setSessions(sessionsResponse.data.sessions);
            console.log('📊 Sessions loaded:', sessionsResponse.data.sessions.length);
          } else {
            console.warn('No sessions data received:', sessionsResponse);
            setSessions([]);
          }
        } catch (sessionError) {
          console.error('Error fetching sessions:', sessionError);
          setSessions([]);
        }
        
      } catch (error) {
        console.error('General error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
        // Provide fallback data
        setDomains([{
          id: 'sample-web-dev',
          name: 'Web Development',
          description: 'Learn web development fundamentals', 
          active: true,
          createdAt: new Date().toISOString(),
          questionCount: 6,
          ruleCount: 0,
          version: '1.0.0'
        }]);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to calculate completed sessions
  const getCompletedSessionsCount = (sessions: Session[]) => {
    if (!sessions || sessions.length === 0) return 0;
    
    // Count sessions that are completed
    const completed = sessions.filter(session => {
      return session?.status === 'completed' || 
             session?.status === 'submitted' ||
             session?.status === 'inference_complete' || // Handle actual API status
             !!session?.completedAt;
    });
    
    console.log('Completed sessions:', completed.length, 'out of', sessions.length);
    return completed.length;
  };

  // Helper function to calculate in-progress sessions
  const getInProgressSessionsCount = (sessions: Session[]) => {
    if (!sessions || sessions.length === 0) return 0;
    
    const inProgress = sessions.filter(session => {
      return session?.status === 'draft' ||
             session?.status === 'processing' ||
             session?.status === 'started' || // Handle actual API status
             (session?.answers && 
              Object.keys(session.answers).length > 0 && 
              session?.status === 'submitted' &&
              !session?.completedAt);
    });
    
    console.log('In progress sessions count:', inProgress.length);
    return inProgress.length;
  };

  // Calculate stats using useMemo for performance and reactivity
  const completedSessionsCount = useMemo(() => {
    return getCompletedSessionsCount(sessions);
  }, [sessions]);

  const inProgressSessionsCount = useMemo(() => {
    return getInProgressSessionsCount(sessions);
  }, [sessions]);
  const getDomainIcon = (domainName: string) => {
    switch (domainName.toLowerCase()) {
      case 'web development':
        return Code2;
      case 'data science':
        return TrendingUp;
      case 'cybersecurity':
        return Shield;
      default:
        return Brain;
    }
  };

  // Helper function to get colors for domain
  const getDomainColors = (domainName: string) => {
    switch (domainName.toLowerCase()) {
      case 'web development':
        return { color: "text-blue-500", bgColor: "bg-blue-500/10" };
      case 'data science':
        return { color: "text-green-500", bgColor: "bg-green-500/10" };
      case 'cybersecurity':
        return { color: "text-red-500", bgColor: "bg-red-500/10" };
      default:
        return { color: "text-purple-500", bgColor: "bg-purple-500/10" };
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Connection Issue</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Link href="/login">
                <Button variant="ghost">Back to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Header */}
        <GlowingCard className="p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Brain className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-full opacity-30 animate-ping" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Track your progress and continue your learning journey
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <PremiumBadge variant="achievement">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Premium User
                  </PremiumBadge>
                  <PremiumBadge variant="skill">
                    Active Learner
                  </PremiumBadge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105">
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </GlowingCard>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard 
            icon={Brain}
            title="Available Domains"
            value={`${domains?.length || 0}`}
            subtitle="Career paths"
            color="primary"
          />
          <StatsCard 
            icon={Trophy}
            title="Your Sessions"
            value={`${sessions?.length || 0}`}
            subtitle="Total assessments"
            color="info"
          />
          <StatsCard 
            icon={Target}
            title="Completed"
            value={`${completedSessionsCount}`}
            subtitle="Finished paths"
            trend="+12%"
            color="success"
          />
          <StatsCard 
            icon={Zap}
            title="In Progress"
            value={`${inProgressSessionsCount}`}
            subtitle="Active learning"
            color="warning"
          />
        </div>

        {/* Hero Section */}
        <GlowingCard className="p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Career Path
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select a domain below to begin your personalized career assessment. 
              Our AI will analyze your background and goals to create a tailored roadmap.
            </p>
          </div>
        </GlowingCard>
          
        {/* Available Domains */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              Available Career Domains
            </h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {domains && domains.length > 0 ? domains.map((domain) => {
              const IconComponent = getDomainIcon(domain.name);
              const colors = getDomainColors(domain.name);
              return (
                <GlowingCard key={domain.id} className="p-6 hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.bgColor} shadow-lg`}>
                      <IconComponent className={`h-6 w-6 ${colors.color}`} />
                    </div>
                    <PremiumBadge variant="default" className="text-xs">
                      {domain.questionCount || 6} questions
                    </PremiumBadge>
                  </div>
                  
                  <h4 className="font-bold text-foreground text-xl mb-2">
                    {domain.name}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {domain.description || 'Discover your personalized career path in this domain'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {domain.ruleCount || 12} pathways
                    </div>
                    
                    <Link href={`/questionnaire/${domain.id}`}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Path
                      </Button>
                    </Link>
                  </div>
                </GlowingCard>
              );
            }) : (
              <GlowingCard className="col-span-full p-8 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-xl">No Domains Available</h3>
                <p className="text-muted-foreground mb-6">
                  Career assessment domains are being prepared. Please check back soon.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </GlowingCard>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              Recent Results
            </h3>
            {sessions && sessions.length > 0 && (
              <Link href="/sessions">
                <Button variant="outline" className="border-border/50">
                  <Clock className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            )}
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.slice(0, 6).map((session) => {
                // Determine completion status using actual API status values
                const isCompleted = session.status === 'completed' || 
                                  session.status === 'inference_complete' || // Handle actual API status
                                  !!session.completedAt;
                
                const getRedirectUrl = () => {
                  if (isCompleted) {
                    return `/result/${session.id}`;
                  } else if (session.status === 'draft' || session.status === 'started') {
                    return `/questionnaire/${session.domainId}`;
                  } else {
                    return `/sessions`;
                  }
                };

                const getStatusVariant = () => {
                  if (isCompleted) return 'achievement';
                  if (session.status === 'processing') return 'skill';
                  if (session.status === 'submitted') return 'premium';
                  if (session.status === 'started') return 'default';
                  return 'default';
                };

                const getActionText = () => {
                  if (isCompleted) return 'view results';
                  if (session.status === 'draft' || session.status === 'started') return 'continue assessment';
                  if (session.status === 'processing') return 'check progress';
                  return 'view details';
                };

                return (
                  <Link href={getRedirectUrl()} key={session?.id || 'unknown'}>
                    <GlowingCard className="p-6 cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-foreground">
                          {session.domain?.name || 'Unknown Domain'}
                        </h4>
                        <PremiumBadge 
                          variant={getStatusVariant()}
                          className="text-xs"
                        >
                          {session.status}
                        </PremiumBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {session.completedAt 
                          ? `Completed on ${new Date(session.completedAt).toLocaleDateString()}`
                          : `Started on ${new Date(session.createdAt).toLocaleDateString()}`
                        }
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Click to {getActionText()}
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </GlowingCard>
                  </Link>
                );
              })}
            </div>
          ) : (
            <GlowingCard className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start with one of the domains above to begin your career journey!
              </p>
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </GlowingCard>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}