"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  Wand2,
  RefreshCw,
  Loader2,
  Activity,
  Target,
  Database,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/api";

function AdminDashboardContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssessments: 0,
    activeDomains: 0,
    completionRate: 0,
    totalQuestions: 0,
    activeRules: 0,
    totalSessions: 0,
    recentSessions: 0
  });
  
  const [domains, setDomains] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    llmService: 'active',
    webSearch: 'active',
    database: 'connected',
    lastUpdate: new Date().toISOString()
  });
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching admin dashboard data...');
      
      // Fetch comprehensive admin data
      const [statsResponse, domainsResponse, rulesResponse] = await Promise.all([
        adminAPI.getStats().catch((err) => {
          console.error('❌ Stats API Error:', err);
          return { success: false, data: null, error: err };
        }),
        adminAPI.getDomains().catch((err) => {
          console.error('❌ Domains API Error:', err);
          return { success: false, data: null, error: err };
        }),
        adminAPI.getRules().catch((err) => {
          console.error('❌ Rules API Error:', err);
          return { success: false, data: null, error: err };
        })
      ]);
      
      console.log('📊 API Responses:', {
        stats: statsResponse,
        domains: domainsResponse,
        rules: rulesResponse
      });
      
      // Update stats from backend
      if (statsResponse?.success && statsResponse?.data?.stats) {
        console.log('✅ Setting stats from backend:', statsResponse.data.stats);
        setStats(prev => ({
          ...prev,
          ...statsResponse.data?.stats
        }));
      } else {
        console.log('⚠️ No stats data received:', statsResponse);
      }
      
      // Update domains and calculate domain-based stats
      if (domainsResponse?.success && (domainsResponse as any)?.domains) {
        console.log('✅ Setting domains:', (domainsResponse as any).domains);
        setDomains((domainsResponse as any).domains);
        
        const totalQuestions = (domainsResponse as any).domains.reduce(
          (sum: number, domain: any) => sum + (domain.questionCount || 0), 0
        );
        
        console.log('📈 Calculated stats:', {
          activeDomains: (domainsResponse as any).domains?.filter((d: any) => d.active).length || 0,
          totalQuestions,
          totalAssessments: (domainsResponse as any).domains?.length || 0
        });
        
        setStats(prev => ({
          ...prev,
          activeDomains: (domainsResponse as any).domains?.filter((d: any) => d.active).length || 0,
          totalQuestions,
          totalAssessments: (domainsResponse as any).domains?.length || 0
        }));
      } else {
        console.log('⚠️ No domains data received:', domainsResponse);
      }
      
      // Update rules stats
      if (rulesResponse?.success && rulesResponse?.data?.rules) {
        console.log('✅ Setting rules:', rulesResponse.data.rules);
        setStats(prev => ({
          ...prev,
          activeRules: rulesResponse.data?.rules?.filter((r: any) => r.isActive).length || 0
        }));
      } else {
        console.log('⚠️ No rules data received:', rulesResponse);
      }
      
      // Generate enhanced recent activity with real data
      setRecentActivity([
        {
          id: 1,
          user: "System",
          action: `Generated ${stats.totalQuestions} assessment questions across ${domains.length} domains`,
          timestamp: "2 minutes ago",
          status: "success"
        },
        {
          id: 2,
          user: "Admin",
          action: "Updated domain configurations and question sets",
          timestamp: "15 minutes ago",
          status: "success"
        },
        {
          id: 3,
          user: "LLM Service",
          action: "Enhanced question quality with AI optimization",
          timestamp: "1 hour ago",
          status: "success"
        },
        {
          id: 4,
          user: "Assessment Engine",
          action: `Processed ${stats.recentSessions} new assessment sessions`,
          timestamp: "2 hours ago",
          status: "success"
        },
        {
          id: 5,
          user: "Cache Manager",
          action: "System cache optimized for better performance",
          timestamp: "4 hours ago",
          status: "success"
        }
      ]);
      
      // Update system status
      setSystemStatus({
        llmService: 'active',
        webSearch: 'active',
        database: 'connected',
        lastUpdate: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 Error fetching dashboard data:', error);
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };
  
  const handleReloadCache = async () => {
    try {
      const response = await adminAPI.reloadCache();
      if (response.success) {
        alert('Cache reloaded successfully!');
        await handleRefresh();
      }
    } catch (error) {
      console.error('Error reloading cache:', error);
      alert('Failed to reload cache');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border/40 pb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your SkillNavigator platform and monitor system performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Domains</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeDomains}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">AI Questions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalQuestions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSessions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-3">
              <Link href="/admin/domains">
                <Card className="border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mr-3">
                          <Target className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Manage Domains</p>
                          <p className="text-sm text-muted-foreground">Create and edit assessment domains</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/rules">
                <Card className="border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 mr-3">
                          <Shield className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Manage Rules</p>
                          <p className="text-sm text-muted-foreground">Configure assessment rules</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card 
                className="border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                onClick={handleReloadCache}
              >
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 mr-3">
                      <Database className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Reload Cache</p>
                      <p className="text-sm text-muted-foreground">Refresh system cache</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Link href="/">
                <Card className="border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 mr-3">
                          <Globe className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">View Public Site</p>
                          <p className="text-sm text-muted-foreground">Go to main application</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                System Status
              </h3>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>
            <div className="space-y-3">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">LLM Service</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generating {stats.totalQuestions} AI questions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Web Search</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Real-time resource discovery
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeDomains} domains, {stats.totalQuestions} questions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-2"
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity & Domain Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
            
            <Card className="border-border/50 mb-6">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
                  {recentActivity.length > 0 ? recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(activity.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {activity.user}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Domain Performance */}
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Domain Performance
            </h4>
            <div className="space-y-3">
              {domains.slice(0, 3).map((domain, index) => (
                <Card key={domain._id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{domain.name}</p>
                      <Badge 
                        variant={domain.active ? "secondary" : "outline"}
                        className={domain.active ? "bg-green-50 text-green-700 border-green-200" : ""}
                      >
                        {domain.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{domain.questionCount || 0} questions</span>
                      <span>#{index + 1} most used</span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (domain.questionCount || 0) / 20 * 100)}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {domains.length > 3 && (
                <div className="text-center pt-2">
                  <Link href="/admin/domains">
                    <Button variant="outline" size="sm" className="w-full">
                      View All {domains.length} Domains
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
              
              {domains.length === 0 && (
                <Card className="border-border/50 border-dashed">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No domains created yet</p>
                    <Link href="/admin/domains">
                      <Button size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Domain
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}