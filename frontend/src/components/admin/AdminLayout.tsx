"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users,
  FileText,
  Target,
  Shield,
  BarChart3,
  Database,
  Brain,
  Home,
  Menu,
  Activity,
  ChevronRight,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { adminAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeDomains: 0,
    totalQuestions: 0,
    activeRules: 0,
    totalSessions: 0
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      console.log('🔍 Fetching admin stats for sidebar...');
      
      const [statsResponse, domainsResponse] = await Promise.all([
        adminAPI.getStats().catch((err) => {
          console.error('❌ Sidebar Stats API Error:', err);
          return { success: false, data: null, error: err };
        }),
        adminAPI.getDomains().catch((err) => {
          console.error('❌ Sidebar Domains API Error:', err);
          return { success: false, data: null, error: err };
        })
      ]);

      console.log('📊 Sidebar API Responses:', {
        stats: statsResponse,
        domains: domainsResponse
      });

      if (statsResponse?.success && statsResponse?.data?.stats) {
        console.log('✅ Setting sidebar stats:', statsResponse.data?.stats);
        setAdminStats(prev => ({
          ...prev,
          ...statsResponse.data?.stats
        }));
      } else {
        console.log('⚠️ No sidebar stats data received:', statsResponse);
      }

      if (domainsResponse?.success && (domainsResponse as any)?.domains) {
        console.log('✅ Setting sidebar domains:', (domainsResponse as any).domains);
        const totalQuestions = (domainsResponse as any).domains.reduce(
          (sum: number, domain: any) => sum + (domain.questionCount || 0), 0
        );
        
        console.log('📈 Sidebar calculated stats:', {
          activeDomains: (domainsResponse as any).domains?.filter((d: any) => d.active).length || 0,
          totalQuestions
        });
        
        setAdminStats(prev => ({
          ...prev,
          activeDomains: (domainsResponse as any).domains?.filter((d: any) => d.active).length || 0,
          totalQuestions
        }));
      } else {
        console.log('⚠️ No sidebar domains data received:', domainsResponse);
      }
    } catch (error) {
      console.error('💥 Error fetching admin stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  const navigationSections = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: Home,
          description: "System overview and analytics"
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          name: "Domains",
          href: "/admin/domains",
          icon: Target,
          badge: adminStats.activeDomains,
          description: "Manage learning domains"
        },
        {
          name: "Questions",
          href: "/admin/questions",
          icon: FileText,
          badge: adminStats.totalQuestions,
          description: "View and edit questions"
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
          badge: adminStats.totalUsers,
          description: "User management"
        }
      ]
    },
    {
      title: "System",
      items: [
        {
          name: "Rules Engine",
          href: "/admin/rules",
          icon: Settings,
          badge: adminStats.activeRules,
          description: "Manage recommendation rules"
        },
        {
          name: "",
          href: "",
          icon: BarChart3,
          description: "Performance insights"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">SkillNavigator</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4 space-y-3">
            {/* User Info & Logout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* System Status */}
            <Card className="bg-accent/50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">System Status</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Admin Panel</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
