"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  BookOpen,
  Target,
  Edit3,
  Mail,
  MapPin,
  Calendar,
  Settings,
  Star,
  Clock,
  Trophy,
  Zap,
  Camera,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Add shimmer animation keyframes
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

// Enhanced Card Component with website-consistent styling
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
    {/* Subtle glow effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-primary/10 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-500 -z-10" />
  </div>
);

// Premium badge with website-consistent colors
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

// Animated progress with website-consistent styling
const GlowingProgress = ({ value, className, ...props }: { value: number; className?: string; [key: string]: any }) => (
  <div className="relative overflow-hidden">
    <Progress 
      value={value} 
      className={cn("h-3 bg-muted", className)}
      {...props}
    />
    <div 
      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${value}%` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-50 animate-pulse rounded-full" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer" />
  </div>
);

// Stat card with website-consistent styling
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

export default function ProfileDashboard() {
  const router = useRouter();
  const { profile, loading, completionPercentage, refreshProfile } = useProfile();
  
  const handleRefreshData = async () => {
    await refreshProfile();
  };

  const handleEditProfile = () => {
    router.push('/profile/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-muted rounded-lg w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg" />
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        
        <GlowingCard className="max-w-md mx-4 text-center p-8">
          <div className="space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-full opacity-30 animate-ping" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                No Profile Found
              </h3>
              <p className="text-muted-foreground">
                Create your profile to unlock personalized learning recommendations and track your progress.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/profile/onboarding')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </div>
        </GlowingCard>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/2 rounded-full blur-2xl animate-pulse delay-500 -z-10" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Profile Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleEditProfile}
              className="border-border/50 hover:border-border"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              onClick={handleRefreshData}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Hero Header - Website-consistent styling */}
        <GlowingCard className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Premium Profile Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl shadow-primary/30">
                  <User className="w-14 h-14 text-primary-foreground" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </div>
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-card border border-border shadow-lg hover:scale-110 transition-transform duration-200 hover:bg-muted"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <div className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
              </div>
              
              {/* Profile Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                    {profile.basicInfo?.fullName || 'Welcome'}
                  </h2>
                  {completionPercentage >= 80 && (
                    <PremiumBadge variant="premium" className="animate-bounce">
                      <Star className="w-3 h-3 mr-1" />
                      Pro User
                    </PremiumBadge>
                  )}
                </div>
                <p className="text-xl text-muted-foreground font-medium">
                  {profile.experience?.currentRole || 'Professional'} • {profile.basicInfo?.experience || profile.experience?.totalYears || 0} years experience
                </p>
                <div className="flex items-center gap-6 text-muted-foreground text-sm">
                  {profile.basicInfo?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.basicInfo.location}</span>
                    </div>
                  )}
                  {profile.basicInfo?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{profile.basicInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Premium Progress Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Profile Completion</span>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {completionPercentage}%
              </span>
            </div>
            <GlowingProgress value={completionPercentage} />
            <p className="text-sm text-muted-foreground">
              {completionPercentage < 100 ? 
                '🚀 Complete your profile to unlock advanced features and personalized recommendations!' : 
                '🎉 Your profile is complete! Enjoy all premium features.'
              }
            </p>
          </div>
        </GlowingCard>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            icon={Trophy}
            title="Profile Score"
            value={`${completionPercentage}%`}
            subtitle="Completion rate"
            trend="+15%"
            color="primary"
          />
          <StatsCard 
            icon={Code}
            title="Technical Skills"
            value={`${(profile.technicalSkills?.programmingLanguages?.length || 0) + (profile.technicalSkills?.frameworks?.length || 0) + (profile.technicalSkills?.tools?.length || 0)}`}
            subtitle="Skills acquired"
            color="info"
          />
          <StatsCard 
            icon={GraduationCap}
            title="Education"
            value={profile.education?.highestDegree ? profile.education.highestDegree.replace('_', ' ').toUpperCase() : 'N/A'}
            subtitle="Highest degree"
            color="success"
          />
          <StatsCard 
            icon={Target}
            title="Career Goals"
            value={profile.careerGoals?.desiredRole ? '1' : '0'}
            subtitle="Active goals"
            color="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <GlowingCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg shadow-primary/20">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{profile.basicInfo?.fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">{profile.basicInfo?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">{profile.basicInfo?.location || 'Not provided'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">{profile.experience?.currentRole || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground/80">
                      {profile.experience?.totalYears !== undefined ? 
                        `${profile.experience.totalYears} years experience` : 
                        (profile.basicInfo?.experience ? `${profile.basicInfo.experience} years experience` : 'Not provided')
                      }
                    </span>
                  </div>
                  {profile.basicInfo?.age && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground/80">Age: {profile.basicInfo.age}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlowingCard>

            {/* Education */}
            <GlowingCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl shadow-lg shadow-emerald-500/20">
                  <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Education</h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-l-4 border-emerald-500">
                  <div className="font-bold text-lg text-foreground">
                    {profile.education?.highestDegree ? 
                      profile.education.highestDegree.charAt(0).toUpperCase() + profile.education.highestDegree.slice(1).replace('_', ' ') : 
                      'Not specified'
                    }
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {profile.education?.fieldOfStudy && `${profile.education.fieldOfStudy}`}
                    {(profile.education as any)?.institution && (profile.education?.fieldOfStudy ? ` • ${(profile.education as any).institution}` : (profile.education as any).institution)}
                    {profile.education?.graduationYear && (profile.education?.fieldOfStudy || (profile.education as any)?.institution ? ` • ${profile.education.graduationYear}` : profile.education.graduationYear)}
                  </div>
                  <PremiumBadge variant="achievement" className="mt-3">
                    {profile.education?.currentlyStudying ? 'Currently Studying' : 'Completed'}
                  </PremiumBadge>
                </div>
              </div>
            </GlowingCard>

            {/* Technical Skills */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Technical Skills</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
              
                <div className="space-y-6">
                  {/* Programming Languages */}
                  {profile.technicalSkills?.programmingLanguages && profile.technicalSkills.programmingLanguages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Programming Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.technicalSkills.programmingLanguages.map((lang, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {typeof lang === 'string' ? lang : lang.language || lang.name || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Frameworks */}
                  {profile.technicalSkills?.frameworks && profile.technicalSkills.frameworks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Frameworks & Libraries</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.technicalSkills.frameworks.map((framework, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {typeof framework === 'string' ? framework : framework.name || framework.framework || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tools */}
                  {profile.technicalSkills?.tools && profile.technicalSkills.tools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Tools & Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.technicalSkills.tools.map((tool, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {typeof tool === 'string' ? tool : tool.name || tool.tool || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Career Goals */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Career Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.careerGoals?.desiredRole && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Desired Role</h4>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <Target className="w-3 h-3 mr-1" />
                        {profile.careerGoals.desiredRole}
                      </Badge>
                    </div>
                  )}
                  
                  {profile.careerGoals?.timeFrame && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Timeline</h4>
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{profile.careerGoals.timeFrame}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Preferences */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Learning Style</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.learningPreferences?.preferredLearningStyle && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Preferred Style</h4>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {profile.learningPreferences.preferredLearningStyle.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  )}
                  
                  {(profile.learningPreferences as any)?.availableTimePerWeek && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Time Commitment</h4>
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{(profile.learningPreferences as any).availableTimePerWeek} hours/week</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/assessment')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-start"
                  >
                    <Trophy className="w-4 h-4 mr-3" />
                    Take Assessment
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    onClick={() => router.push('/learning-path')}
                    variant="outline"
                    className="w-full border-border/50 justify-start"
                  >
                    <BookOpen className="w-4 h-4 mr-3" />
                    View Learning Path
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    onClick={() => router.push('/skills')}
                    variant="outline"
                    className="w-full border-border/50 justify-start"
                  >
                    <Code className="w-4 h-4 mr-3" />
                    Explore Skills
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}