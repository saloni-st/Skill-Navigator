"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Spotlight } from "@/components/ui/spotlight-new";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { 
  Brain, 
  Code2, 
  Shield, 
  TrendingUp, 
  Users, 
  Zap, 
  LogOut, 
  User, 
  Star, 
  Sparkles, 
  Trophy, 
  Target, 
  ArrowRight,
  CheckCircle2,
  Rocket,
  Clock,
  BarChart3,
  Globe,
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
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

// Feature Card with 3D effect
const FeatureCard = ({ icon: Icon, title, description, features, gradient, delay = 0 }: {
  icon: any;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  delay?: number;
}) => (
  <CardContainer className="inter-var">
    <CardBody className="bg-card relative group/card border-border/50 w-auto sm:w-[30rem] h-auto rounded-xl p-6 border hover:shadow-2xl hover:shadow-primary/[0.1] transition-all duration-500">
      <CardItem
        translateZ="50"
        className="text-xl font-bold text-foreground"
      >
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl mb-4", gradient)}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {title}
      </CardItem>
      <CardItem
        as="p"
        translateZ="60"
        className="text-muted-foreground text-sm max-w-sm mt-2"
      >
        {description}
      </CardItem>
      <CardItem translateZ="80" className="mt-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardItem>
    </CardBody>
  </CardContainer>
);

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  const features = [
    {
      icon: Code2,
      title: "Web Development",
      description: "Master modern web technologies with hands-on projects and industry best practices",
      features: [
        "Frontend frameworks (React, Vue, Angular)",
        "Backend development (Node.js, Express)",
        "Database design and optimization",
        "DevOps and deployment strategies"
      ],
      gradient: "bg-blue-500/10"
    },
    {
      icon: TrendingUp,
      title: "Data Science",
      description: "Dive into analytics, machine learning, and AI with real-world data projects",
      features: [
        "Python programming and libraries",
        "Statistical analysis and modeling",
        "Machine learning algorithms",
        "Data visualization and storytelling"
      ],
      gradient: "bg-green-500/10"
    },
    {
      icon: Shield,
      title: "Cybersecurity",
      description: "Learn to protect systems and data with ethical hacking and security protocols",
      features: [
        "Network security fundamentals",
        "Penetration testing techniques",
        "Security frameworks and compliance",
        "Incident response and forensics"
      ],
      gradient: "bg-red-500/10"
    }
  ];

  return (

    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/2 rounded-full blur-2xl animate-pulse delay-500 -z-10" />

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                SkillNavigator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {user?.name}
                    </span>
                  </div>
                  <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                    <Button variant="ghost" className="hover:bg-primary/10">
                      <User className="h-4 w-4 mr-2" />
                      {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 bg-black/[0.96] bg-grid-white/[0.02] relative overflow-hidden">
        <Spotlight />
        <h1 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-50 to-neutral-400 text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
          Your <br /> Career Navigator
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-300 text-center relative z-20">
          Get personalized learning roadmaps powered by advanced AI. Whether you're diving into 
          Web Development, Data Science, or Cybersecurity, we'll guide you from beginner to expert 
          with intelligent recommendations tailored just for you.
        </p>
        
        {/* Enhanced Stats with glow effects */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-2xl mx-auto relative z-20">
          <GlowingCard className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-2">
              10K+
            </div>
            <div className="text-sm text-muted-foreground font-medium">Active Learners</div>
            <div className="mt-2 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary mr-1" />
              <span className="text-xs text-primary">Growing Fast</span>
            </div>
          </GlowingCard>
          
          <GlowingCard className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-primary bg-clip-text text-transparent mb-2">
              95%
            </div>
            <div className="text-sm text-muted-foreground font-medium">Success Rate</div>
            <div className="mt-2 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">Proven Results</span>
            </div>
          </GlowingCard>
          
          <GlowingCard className="p-6 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-primary bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div className="text-sm text-muted-foreground font-medium">AI Support</div>
            <div className="mt-2 flex items-center justify-center">
              <Zap className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-xs text-purple-500">Always Available</span>
            </div>
          </GlowingCard>
        </div>

        {/* Enhanced CTA buttons */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 relative z-20">
          {isAuthenticated ? (
            <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Rocket className="h-5 w-5 mr-3" />
                {user?.role === 'admin' ? 'Go to Admin Panel' : 'Continue Learning'}
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Rocket className="h-5 w-5 mr-3" />
                Start Your Journey
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            </Link>
          )}
          
          <Link href="#features">
            <Button variant="outline" size="lg" className="border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 px-10 py-4 text-lg rounded-xl transition-all duration-300">
              <Lightbulb className="h-5 w-5 mr-3" />
              Explore Features
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-300 relative z-20">
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Get started in 2 minutes</span>
          </div>
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Personalized recommendations</span>
          </div>
        </div>
      </BackgroundLines>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Choose Your Path
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Master In-Demand Skills
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our AI analyzes your current skills and creates personalized roadmaps across multiple domains
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                features={feature.features}
                gradient={feature.gradient}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Trophy className="h-3 w-3 mr-1" />
              Why Choose Us
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Accelerate Your Learning
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our platform combines cutting-edge AI with proven learning methodologies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlowingCard className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 mx-auto mb-6">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                AI-Powered Recommendations
              </h3>
              <p className="text-muted-foreground mb-6">
                Our advanced AI analyzes your learning patterns and suggests the most effective next steps for your career growth.
              </p>
              <div className="flex items-center justify-center text-sm text-primary font-medium">
                <Zap className="h-4 w-4 mr-2" />
                Smart Learning Paths
              </div>
            </GlowingCard>

            <GlowingCard className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 mx-auto mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Personalized Learning Paths
              </h3>
              <p className="text-muted-foreground mb-6">
                Every learner is unique. Get custom roadmaps that adapt to your schedule, goals, and learning style.
              </p>
              <div className="flex items-center justify-center text-sm text-primary font-medium">
                <Users className="h-4 w-4 mr-2" />
                Tailored Experience
              </div>
            </GlowingCard>

            <GlowingCard className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Real-time Progress Tracking
              </h3>
              <p className="text-muted-foreground mb-6">
                Monitor your growth with detailed analytics, celebrate achievements, and stay motivated on your journey.
              </p>
              <div className="flex items-center justify-center text-sm text-primary font-medium">
                <Clock className="h-4 w-4 mr-2" />
                Track Progress
              </div>
            </GlowingCard>
          </div>

          {/* Additional features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/30 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Expert Curated</div>
                <div className="text-sm text-muted-foreground">Industry-verified content</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/30 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Global Community</div>
                <div className="text-sm text-muted-foreground">Learn with peers worldwide</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/30 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Latest Tech</div>
                <div className="text-sm text-muted-foreground">Always up-to-date curriculum</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-card/30 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Trophy className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Certifications</div>
                <div className="text-sm text-muted-foreground">Industry-recognized credentials</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative">
        <BackgroundBeams />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <GlowingCard className="max-w-4xl mx-auto text-center p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-primary/10 mx-auto mb-8">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already building their future with SkillNavigator. 
              Start your personalized learning journey today and unlock your potential.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {isAuthenticated ? (
                <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Continue Learning
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="border-border/50 hover:bg-card px-8 py-3 text-lg">
                      Already have an account?
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              ✨ No credit card required • 🚀 Get started in 2 minutes • 🎯 Personalized recommendations
            </div>
          </GlowingCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <span className="ml-3 text-xl font-bold text-foreground">
                  SkillNavigator
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Your AI-powered career guidance platform. Navigate your learning journey 
                with personalized recommendations and expert insights.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-primary mr-2" />
                  4.9/5 rating
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary mr-2" />
                  10K+ learners
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Sign In</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Learning Paths</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Code2 className="h-3 w-3 text-primary mr-2" />
                  <span>Web Development</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-primary mr-2" />
                  <span>Data Science</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-3 w-3 text-primary mr-2" />
                  <span>Cybersecurity</span>
                </li>
                <li className="flex items-center">
                  <Brain className="h-3 w-3 text-primary mr-2" />
                  <span>AI & Machine Learning</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">
                © 2025 SkillNavigator. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}