"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Brain, 
  Settings, 
  Users, 
  Target,
  FileText,
  TrendingUp,
  Shield,
  Plus,
  ArrowRight,
  Wand2,
  RefreshCw,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

function AdminDomainsContent() {
  const [domains, setDomains] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{open: boolean, domain: any} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAudience: 'professionals and learners'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching domains data...');
      
      const [domainsResponse, statsResponse] = await Promise.all([
        adminAPI.getDomains(),
        adminAPI.getStats().catch(() => null)
      ]);
      
      console.log('📊 Domains Response:', domainsResponse);
      console.log('📈 Stats Response:', statsResponse);
      
      // Domains API returns: {success: true, domains: [...]}
      if (domainsResponse?.success && (domainsResponse as any)?.domains) {
        console.log('✅ Setting domains:', (domainsResponse as any).domains);
        setDomains((domainsResponse as any).domains);
      } else {
        console.log('⚠️ No domains data received:', domainsResponse);
        setDomains([]);
      }
      
      // Stats API returns: {success: true, data: {stats: {...}}}
      if (statsResponse?.success && statsResponse?.data?.stats) {
        console.log('✅ Setting stats:', statsResponse.data.stats);
        setStats(statsResponse.data.stats);
      }
      
    } catch (error) {
      console.error('💥 Error fetching admin data:', error);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    try {
      setCreating(true);
      
      const response = await adminAPI.createDomain({
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAudience: formData.targetAudience
      });

      if (response.success) {
        setFormData({ name: '', description: '', targetAudience: 'professionals and learners' });
        setShowCreateForm(false);
        await fetchData();
        toast.success(`Domain "${formData.name}" created successfully with AI-generated questions!`);
      } else {
        toast.error(response.message || 'Failed to create domain');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create domain. Please try again.';
      toast.error(errorMessage);
      console.error('Error creating domain:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerateQuestions = async (domainId: string, domainName: string) => {
    if (!confirm(`Regenerate questions for "${domainName}"? This will replace all existing questions.`)) {
      return;
    }

    try {
      setRegenerating(domainId);
      
      const response = await adminAPI.regenerateQuestions(domainId);
      
      if (response.success) {
        await fetchData();
        toast.success(`Questions regenerated successfully for "${domainName}"!`);
      } else {
        toast.error(response.message || 'Failed to regenerate questions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate questions. Please try again.';
      toast.error(errorMessage);
      console.error('Error regenerating questions:', error);
    } finally {
      setRegenerating(null);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    try {
      setDeleting(domainId);
      
      const response = await adminAPI.deleteDomain(domainId);
      
      // Check both response.success and HTTP status code
      if (response.success && response.status !== 400) {
        await fetchData();
        setShowDeleteDialog(null);
        setDeleteConfirmText('');
        toast.success(`Domain "${domainName}" deleted successfully`);
        console.log(`✅ ${response.message}`);
      } else {
        // Handle business logic errors (like active sessions)
        const errorMessage = response.message || 'Failed to delete domain';
        
        // Provide helpful guidance for active sessions error
        if (errorMessage.includes('active session')) {
          toast.error(
            `${errorMessage} Go to Sessions page (/sessions) to complete or delete them.`,
            { duration: 8000 } // Longer duration for actionable message
          );
        } else {
          toast.error(errorMessage);
        }
        
        console.error(`❌ Error: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete domain';
      toast.error(errorMessage);
      console.error('Error deleting domain:', error);
    } finally {
      setDeleting(null);
    }
  };

  const openDeleteDialog = (domain: any) => {
    setShowDeleteDialog({open: true, domain});
    setDeleteConfirmText('');
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(null);
    setDeleteConfirmText('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-foreground">Loading admin panel...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Domain Management</h1>
            <p className="text-muted-foreground">Manage learning domains with AI-powered question generation</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Domain
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Domains</p>
                  <p className="text-2xl font-bold text-foreground">{domains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {domains.reduce((acc, domain) => acc + (domain.questionCount || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wand2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                  <p className="text-2xl font-bold text-white">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Active Domains</p>
                  <p className="text-2xl font-bold text-foreground">
                    {domains.filter(d => d.active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Domains</p>
                  <p className="text-2xl font-bold text-foreground">
                    {domains.filter(d => d.active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showCreateForm && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Wand2 className="w-5 h-5 mr-2 text-primary" />
                Create New Domain with AI Questions
              </CardTitle>
              <p className="text-muted-foreground">
                Enter domain details and our AI will automatically generate 15+ relevant, high-quality questions
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDomain} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Domain Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Machine Learning, Digital Marketing, Mobile Development"
                    className="bg-background border-border"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the domain, its scope, and what learners should expect..."
                    className="bg-background border-border"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Audience
                  </label>
                  <Input
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    placeholder="professionals and learners"
                    className="bg-background border-border"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Create Domain
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <Card key={domain._id} className="border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-foreground text-lg">{domain.name}</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {domain.description}
                    </p>
                  </div>
                  <Badge variant={domain.active ? "default" : "secondary"} className="ml-2">
                    {domain.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="text-foreground font-medium">{domain.questionCount || 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="text-foreground font-medium">{domain.version || '1.0.0'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-foreground font-medium">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegenerateQuestions(domain._id, domain.name)}
                      disabled={regenerating === domain._id || deleting === domain._id}
                      className="flex-1"
                    >
                      {regenerating === domain._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                    
                    <Link href={`/questionnaire/${domain._id}`}>
                      <Button 
                        size="sm"
                        disabled={deleting === domain._id}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(domain)}
                      disabled={regenerating === domain._id || deleting === domain._id}
                      className="flex-1"
                    >
                      {deleting === domain._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 mr-1" />
                      )}
                      Delete Domain
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {domains.length === 0 && !loading && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No domains yet</h3>
            <p className="text-muted-foreground mb-6">Create your first domain to get started with AI-generated questions</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Domain
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog?.open} onOpenChange={closeDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-destructive">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Delete Domain: {showDeleteDialog?.domain?.name}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    ⚠️ <strong>This action cannot be undone!</strong> This will permanently delete:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>The domain "<strong>{showDeleteDialog?.domain?.name}</strong>"</li>
                    <li>All {showDeleteDialog?.domain?.questionCount || 0} questions</li>
                    <li>All associated rules and sessions</li>
                  </ul>
                  <div className="text-sm text-muted-foreground mt-4">
                    Type <code className="bg-muted px-1 rounded text-xs">{showDeleteDialog?.domain?.name}</code> to confirm:
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "${showDeleteDialog?.domain?.name}" to confirm`}
                className="bg-background border-border"
              />
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={deleting === showDeleteDialog?.domain?._id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteDomain(showDeleteDialog?.domain?._id, showDeleteDialog?.domain?.name)}
                disabled={
                  deleteConfirmText !== showDeleteDialog?.domain?.name || 
                  deleting === showDeleteDialog?.domain?._id
                }
              >
                {deleting === showDeleteDialog?.domain?._id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function AdminDomainsPage() {
  return (
    <ErrorBoundary>
      <ProtectedRoute adminOnly>
        <AdminDomainsContent />
      </ProtectedRoute>
    </ErrorBoundary>
  );
}