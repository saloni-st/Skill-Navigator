"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, Target, Edit, Trash2, RefreshCw, Loader2, Plus } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/api";

function QuestionsPageContent() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching domains for questions...');
      
      const response = await adminAPI.getDomains();
      console.log('📊 Domains Response:', response);
      
      if (response?.success && (response as any)?.domains) {
        console.log('✅ Setting domains:', (response as any).domains);
        setDomains((response as any).domains);
      } else {
        console.log('⚠️ No domains data received:', response);
        setDomains([]);
      }
    } catch (error) {
      console.error('💥 Error fetching domains:', error);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDomains();
    setRefreshing(false);
  };

  const totalQuestions = domains.reduce((sum, domain) => sum + (domain.questionCount || 0), 0);
  const aiGeneratedQuestions = totalQuestions; // All questions are AI generated

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Question Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage AI-generated questions across all domains
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Questions
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                  <p className="text-2xl font-bold text-foreground">{aiGeneratedQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Domains</p>
                  <p className="text-2xl font-bold text-foreground">{domains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg per Domain</p>
                  <p className="text-2xl font-bold text-foreground">
                    {domains.length > 0 ? Math.round(totalQuestions / domains.length) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Filter */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Filter by Domain</CardTitle>
            <CardDescription>
              Select a domain to view its questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedDomain === '' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDomain('')}
              >
                All Domains ({totalQuestions})
              </Button>
              {domains.map((domain) => (
                <Button 
                  key={domain._id}
                  variant={selectedDomain === domain._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(domain._id)}
                >
                  {domain.name} ({domain.questionCount || 0})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions by Domain */}
        <div className="space-y-4">
          {domains.length > 0 ? (
            domains
              .filter(domain => selectedDomain === '' || domain._id === selectedDomain)
              .map((domain) => (
                <Card key={domain._id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Target className="h-5 w-5 mr-2 text-primary" />
                          {domain.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {domain.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {domain.questionCount || 0} Questions
                        </Badge>
                        <Badge variant={domain.active ? "default" : "outline"}>
                          {domain.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Brain className="h-4 w-4" />
                          <span>AI Generated: {domain.questionCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>Target Audience: {domain.targetAudience || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Questions
                        </Button>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Generate More
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Question Coverage</span>
                        <span>{domain.questionCount || 0}/20 recommended</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, ((domain.questionCount || 0) / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No questions available</h3>
                <p className="text-muted-foreground mb-4">
                  Create domains first to generate AI-powered questions
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Domain
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function QuestionsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <QuestionsPageContent />
    </ProtectedRoute>
  );
}