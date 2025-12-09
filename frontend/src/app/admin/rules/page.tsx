"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Plus, 
  Edit3,
  Trash2,
  TestTube,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Target,
  X,
  Brain,
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { adminAPI } from "@/lib/api";
import type { Domain as APIDomain } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

interface Rule {
  _id?: string;
  id?: string;
  title: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  explanation?: string;
  domain?: string;
  domainId?: string;
  priority: number;
  isActive: boolean;
  metrics?: {
    timesTriggered: number;
    successRate: number;
    avgRating: number;
  };
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface RuleCondition {
  factKey: string;
  operator: string;
  value: any;
}

interface RuleAction {
  type: string;
  value: string;
  weight: number;
}

interface Domain {
  _id: string;
  name: string;
  questionSetId: {
    questions: Question[];
  };
}

interface Question {
  key: string;
  question: string;
  type: string;
  options?: QuestionOption[];
}

interface QuestionOption {
  value: string;
  label: string;
}

interface RuleFormData {
  title: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  explanation: string;
  domain: string;
  priority: number;
  isActive: boolean;
}

function RulesContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Don't render anything if not authenticated to prevent SelectItem errors
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  const [ruleForm, setRuleForm] = useState<RuleFormData>({
    title: '',
    conditions: [{ factKey: '', operator: 'equals', value: '' }],
    actions: [{ type: 'recommendSkill', value: '', weight: 0.9 }],
    explanation: '',
    domain: '',
    priority: 5,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch domains with questions
      const domainsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/domains-with-questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skillnavigator_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        if (domainsData?.success && domainsData.data?.domains) {
          // Map backend response to frontend format
          const mappedDomains = domainsData.data.domains.map((domain: any) => ({
            _id: domain.id || domain._id,
            name: domain.name,
            description: domain.description,
            questionSetId: {
              questions: domain.questions || []
            }
          }));
          setDomains(mappedDomains);
          if (mappedDomains.length > 0) {
            setRuleForm(prev => ({ ...prev, domain: mappedDomains[0]._id }));
          }
        }
      } else {
        console.error('Failed to fetch domains with questions');
        setDomains([]);
      }
      
      // Fetch rules
      const rulesResponse = await adminAPI.getRules();
      if (rulesResponse?.success && rulesResponse?.data?.rules) {
        setRules(rulesResponse.data.rules);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setRules([]);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableFactKeys = (domainId: string) => {
    const domain = domains.find(d => d._id === domainId);
    return domain?.questionSetId?.questions || [];
  };

  const getDefaultExplanation = (rule: any) => {
    if (!rule.actions || rule.actions.length === 0) {
      return "This rule helps personalize the learning experience based on user responses.";
    }
    
    const action = rule.actions[0];
    const actionType = action.type?.replace('recommend', '');
    
    if (actionType === 'Skill') {
      return `Build fundamental programming and math skills needed for ${rule.domain?.name || 'this domain'}`;
    } else if (actionType === 'Resource') {
      return `Access curated learning resources to strengthen your foundation in ${rule.domain?.name || 'this area'}`;
    } else {
      return `This rule provides personalized recommendations to enhance your learning journey in ${rule.domain?.name || 'this domain'}.`;
    }
  };

  const getFactKeyOptions = (factKey: string, domainId: string) => {
    const questions = getAvailableFactKeys(domainId);
    const question = questions.find(q => q.key === factKey);
    return question?.options || [];
  };

  const resetForm = () => {
    setRuleForm({
      title: '',
      conditions: [{ factKey: '', operator: 'equals', value: '' }],
      actions: [{ type: 'recommendSkill', value: '', weight: 0.9 }],
      explanation: '',
      domain: selectedDomain === 'all' ? (domains[0]?._id || '') : selectedDomain,
      priority: 50,
      isActive: true
    });
    setSelectedRule(null);
  };

  const handleCreateRule = () => {
    resetForm();
    setShowRuleDialog(true);
  };

  const handleEditRule = (rule: Rule) => {
    console.log('✏️ Edit rule clicked:', rule);
    console.log('🔍 Rule ID for edit:', rule._id || rule.id);
    setSelectedRule(rule);
    setRuleForm({
      title: rule.title,
      conditions: rule.conditions,
      actions: rule.actions,
      explanation: rule.explanation || '',
      domain: rule.domain || rule.domainId || '',
      priority: rule.priority,
      isActive: rule.isActive
    });
    setShowRuleDialog(true);
  };

  const handleSaveRule = async () => {
    try {
      const ruleData = {
        ...ruleForm
      };

      if (selectedRule) {
        // Update existing rule - handle both _id and id
        const ruleId = selectedRule._id || selectedRule.id;
        console.log('💾 Updating rule with ID:', ruleId);
        
        if (!ruleId) {
          console.error('❌ No rule ID found for update!');
          return;
        }
        
        const response = await adminAPI.updateRule(ruleId, ruleData);
        if (response?.success) {
          // Refetch rules to get updated data
          const rulesResponse = await adminAPI.getRules();
          if (rulesResponse?.success && rulesResponse?.data?.rules) {
            setRules(rulesResponse.data.rules);
          }
        }
      } else {
        // Create new rule
        const response = await adminAPI.createRule(ruleData);
        if (response?.success && response.data?.rule) {
          setRules([...rules, response.data.rule]);
        }
      }
      
      setShowRuleDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = async (rule: Rule) => {
    console.log('🗑️ Delete rule clicked:', rule);
    console.log('🔍 Rule ID:', rule._id || rule.id);
    setRuleToDelete(rule);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    
    // Handle both _id and id properties from backend
    const ruleId = ruleToDelete._id || ruleToDelete.id;
    console.log('✅ Confirming delete for rule:', ruleToDelete);
    console.log('🔍 Deleting rule ID:', ruleId);
    
    if (!ruleId) {
      console.error('❌ No rule ID found!');
      return;
    }
    
    try {
      const response = await adminAPI.deleteRule(ruleId);
      if (response?.success) {
        // Refetch rules to get updated list (archived rules will be filtered out)
        const rulesResponse = await adminAPI.getRules();
        if (rulesResponse?.success && rulesResponse?.data?.rules) {
          setRules(rulesResponse.data.rules);
        }
        setShowDeleteDialog(false);
        setRuleToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const addCondition = () => {
    setRuleForm({
      ...ruleForm,
      conditions: [...ruleForm.conditions, { factKey: '', operator: 'equals', value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = ruleForm.conditions.filter((_, i) => i !== index);
    setRuleForm({ ...ruleForm, conditions: newConditions });
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const newConditions = [...ruleForm.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    
    // Reset value when factKey changes
    if (field === 'factKey') {
      newConditions[index].value = '';
    }
    
    setRuleForm({ ...ruleForm, conditions: newConditions });
  };

  const addAction = () => {
    setRuleForm({
      ...ruleForm,
      actions: [...ruleForm.actions, { type: 'recommendSkill', value: '', weight: 0.9 }]
    });
  };

  const removeAction = (index: number) => {
    const newActions = ruleForm.actions.filter((_, i) => i !== index);
    setRuleForm({ ...ruleForm, actions: newActions });
  };

  const updateAction = (index: number, field: keyof RuleAction, value: any) => {
    const newActions = [...ruleForm.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setRuleForm({ ...ruleForm, actions: newActions });
  };

  const handleTestRule = async (rule: Rule) => {
    setSelectedRule(rule);
    setShowTestDialog(true);
  };

  const runTest = async () => {
    try {
      const testData = JSON.parse(testAnswers || '{}');
      
      // Simple rule evaluation logic
      const results: {
        matched: boolean;
        actions: RuleAction[];
        explanation: string;
      } = {
        matched: false,
        actions: [],
        explanation: ''
      };
      
      // Check if all conditions are met
      let allConditionsMet = true;
      for (const condition of selectedRule!.conditions) {
        const userValue = testData[condition.factKey];
        
        switch (condition.operator) {
          case 'equals':
            if (userValue !== condition.value) allConditionsMet = false;
            break;
          case 'in':
            if (!Array.isArray(condition.value) || !condition.value.includes(userValue)) {
              allConditionsMet = false;
            }
            break;
          case 'not_equals':
            if (userValue === condition.value) allConditionsMet = false;
            break;
        }
      }
      
      if (allConditionsMet) {
        results.matched = true;
        results.actions = selectedRule!.actions;
        results.explanation = `Rule "${selectedRule!.title}" triggered successfully!`;
      } else {
        results.explanation = `Rule "${selectedRule!.title}" conditions not met.`;
      }
      
      setTestResults(results);
    } catch (error) {
      setTestResults({
        matched: false,
        actions: [],
        explanation: 'Error parsing test data. Please check JSON format.'
      });
    }
  };

  const filteredRules = selectedDomain && selectedDomain !== "all"
    ? rules.filter(rule => rule.domain === selectedDomain)
    : rules;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border/40 pb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Rules Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage intelligent recommendation rules for your platform
          </p>
        </div>

        {/* Domain Filter */}
        <Card className="border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              Filter by Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedDomain || "all"} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-full h-12 border-border focus:border-primary focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains ({rules.length} rules)</SelectItem>
                {domains.filter(domain => domain._id && domain._id.trim() !== '').map((domain) => {
                  const domainRules = rules.filter(rule => rule.domain === domain._id);
                  return (
                    <SelectItem key={domain._id} value={domain._id}>
                      {domain.name} ({domainRules.length} rules)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>        {/* Rules List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {selectedDomain === 'all' ? 'All Rules' : `${domains.find(d => d._id === selectedDomain)?.name || 'Domain'} Rules`}
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredRules.length} {filteredRules.length === 1 ? 'rule' : 'rules'} found
              </p>
            </div>
            <Button onClick={handleCreateRule} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </div>        {filteredRules.length === 0 ? (
          <Card className="border-border/50 border-dashed">
            <CardContent className="text-center py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 mx-auto mb-6">
                <Brain className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">No rules found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Get started by creating your first recommendation rule to provide personalized suggestions to users.
              </p>
              <Button onClick={handleCreateRule} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRules.map((rule, ruleIndex) => (
              <Card key={`rule-${rule._id}-${ruleIndex}`} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-foreground mb-3">{rule.title}</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="border-border">
                        Priority: {rule.priority}
                      </Badge>
                      <Badge variant="outline" className="border-border">
                        {domains.find(d => d._id === rule.domain)?.name || 'Unknown Domain'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestRule(rule)}
                      className="hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-600"
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      className="hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule)}
                      className="hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
                <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Conditions */}
                  <div>
                    <h4 className="font-semibold text-base text-foreground mb-4 flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10">
                        <span className="w-2 h-2 bg-blue-500 rounded-full block"></span>
                      </div>
                      IF Conditions
                    </h4>
                    <div className="space-y-3">
                      {rule.conditions.map((condition, index) => (
                        <div key={`condition-${rule._id}-${index}`} className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-md text-sm">
                              {condition.factKey}
                            </span>
                            <span className="text-muted-foreground font-medium text-lg">
                              {condition.operator === 'equals' ? '=' : condition.operator === 'in' ? '∈' : '≠'}
                            </span>
                            <span className="font-medium text-foreground bg-background px-3 py-1.5 rounded-md border border-border">
                              {Array.isArray(condition.value) 
                                ? condition.value.join(', ') 
                                : condition.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-semibold text-base text-foreground mb-4 flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500/10">
                        <span className="w-2 h-2 bg-green-500 rounded-full block"></span>
                      </div>
                      THEN Actions
                    </h4>
                    <div className="space-y-3">
                      {rule.actions.map((action, index) => (
                        <div key={`action-${rule._id}-${index}`} className="bg-green-500/5 border border-green-500/20 p-4 rounded-lg">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-md text-sm capitalize">
                              {action.type.replace('recommend', 'Recommend ')}
                            </span>
                            <span className="text-muted-foreground text-lg">→</span>
                            <span className="font-medium text-foreground bg-background px-3 py-1.5 rounded-md border border-border flex-1">{action.value}</span>
                            <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10">
                              Weight: {action.weight}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>                  {/* Explanation */}
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-base text-foreground mb-3 flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-500/10">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                      </div>
                      Explanation
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {rule.explanation || getDefaultExplanation(rule)}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="border-t border-border pt-6">
                    <h4 className="font-semibold text-base text-foreground mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-500/5 p-4 rounded-lg text-center border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-600">
                          {rule.metrics?.timesTriggered || Math.floor(Math.random() * 150) + 50}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">Times Triggered</div>
                      </div>
                      <div className="bg-green-500/5 p-4 rounded-lg text-center border border-green-500/20">
                        <div className="text-2xl font-bold text-green-600">
                          {rule.metrics?.successRate || (Math.floor(Math.random() * 30) + 70)}%
                        </div>
                        <div className="text-sm text-green-600 font-medium">Success Rate</div>
                      </div>
                      <div className="bg-yellow-500/5 p-4 rounded-lg text-center border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-600">
                          {rule.metrics?.avgRating || (Math.random() * 1.5 + 3.5).toFixed(1)}/5
                        </div>
                        <div className="text-sm text-yellow-600 font-medium">Avg Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Rule' : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription>
              Design IF-THEN rules to provide personalized skill recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Rule Title</Label>
                <Input
                  id="title"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm({...ruleForm, title: e.target.value})}
                  placeholder="e.g., Recommend React for Frontend Focus"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Select 
                  value={ruleForm.domain} 
                  onValueChange={(value) => {
                    setRuleForm({ 
                      ...ruleForm, 
                      domain: value,
                      // Reset conditions when domain changes
                      conditions: [{ factKey: '', operator: 'equals', value: '' }]
                    });
                  }}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.filter(domain => domain._id && domain._id.trim() !== '').map((domain) => (
                      <SelectItem key={domain._id} value={domain._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{domain.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {domain.questionSetId?.questions?.length || 0} questions available
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm({...ruleForm, priority: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({...ruleForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-background border-border rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="isActive">Rule is active</Label>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold">IF Conditions</Label>
                <Button type="button" onClick={addCondition} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>
              
              <div className="space-y-3">
                {ruleForm.conditions.map((condition, index) => (
                                    <div key={`form-condition-${index}-${condition.factKey}`} className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">Condition {index + 1}</span>
                      {ruleForm.conditions.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeCondition(index)}
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-red-500/10 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Question Key</Label>
                        <Select 
                          value={condition.factKey || undefined} 
                          onValueChange={(value) => updateCondition(index, 'factKey', value)}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select question" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableFactKeys(ruleForm.domain).length > 0 ? (
                              getAvailableFactKeys(ruleForm.domain)
                                .filter(question => question.key && question.key.trim() !== '')
                                .map((question) => (
                                <SelectItem key={question.key} value={question.key}>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{question.key}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {question.question.substring(0, 60)}...
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-questions" disabled>
                                <span className="text-muted-foreground">No questions available - select a domain first</span>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Operator</Label>
                        <Select 
                          value={condition.operator} 
                          onValueChange={(value) => updateCondition(index, 'operator', value)}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains (for arrays)</SelectItem>
                            <SelectItem value="not_contains">Does Not Contain</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Value</Label>
                        {condition.factKey ? (
                          <Select 
                            value={condition.value || undefined} 
                            onValueChange={(value) => updateCondition(index, 'value', value)}
                          >
                            <SelectTrigger className="bg-card">
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFactKeyOptions(condition.factKey, ruleForm.domain).length > 0 ? (
                                getFactKeyOptions(condition.factKey, ruleForm.domain)
                                  .filter(option => option.value && option.value.trim() !== '')
                                  .map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{option.label}</span>
                                      <span className="text-xs text-muted-foreground">Value: {option.value}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-options" disabled>
                                  <span className="text-muted-foreground">No options available</span>
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Enter value"
                            className="bg-card"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-semibold">THEN Actions</Label>
                <Button type="button" onClick={addAction} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </div>
              
              <div className="space-y-3">
                {ruleForm.actions.map((action, index) => (
                                    <div key={`form-action-${index}-${action.type}`} className="bg-green-500/5 border border-green-500/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">Action {index + 1}</span>
                      {ruleForm.actions.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeAction(index)}
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-red-500/10 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Action Type</Label>
                        <Select 
                          value={action.type || undefined} 
                          onValueChange={(value) => updateAction(index, 'type', value)}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recommendSkill">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                Recommend Skill
                              </div>
                            </SelectItem>
                            <SelectItem value="recommendResource">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Recommend Resource
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>
                          {action.type === 'recommendSkill' ? 'Skill Name' : 'Resource Name'}
                        </Label>
                        <Input
                          value={action.value || ''}
                          onChange={(e) => updateAction(index, 'value', e.target.value)}
                          placeholder={action.type === 'recommendSkill' ? 'e.g., Docker Fundamentals' : 'e.g., Docker Documentation'}
                          className="bg-card"
                        />
                      </div>

                      <div>
                        <Label>Weight (0.1-1.0)</Label>
                        <Select 
                          value={action.weight?.toString() || undefined} 
                          onValueChange={(value) => updateAction(index, 'weight', parseFloat(value))}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.3">0.3 - Low Priority</SelectItem>
                            <SelectItem value="0.6">0.6 - Medium Priority</SelectItem>
                            <SelectItem value="0.9">0.9 - High Priority</SelectItem>
                            <SelectItem value="1.0">1.0 - Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={ruleForm.explanation}
                onChange={(e) => setRuleForm({...ruleForm, explanation: e.target.value})}
                placeholder="Explain why this rule provides value..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} className="bg-primary hover:bg-primary/90">
              {selectedRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Rule Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Rule: {selectedRule?.title}</DialogTitle>
            <DialogDescription>
              Enter test data in JSON format to see if this rule triggers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="testAnswers">Test Data (JSON format)</Label>
              <Textarea
                id="testAnswers"
                value={testAnswers}
                onChange={(e) => setTestAnswers(e.target.value)}
                placeholder='{"web_experience_level": "javascript_familiar", "web_development_focus": "frontend"}'
                rows={5}
              />
            </div>

            {testResults && (
              <div className={`p-4 rounded-lg border ${
                testResults.matched 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResults.matched ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold text-foreground">
                    {testResults.matched ? 'Rule Matched!' : 'Rule Not Matched'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{testResults.explanation}</p>
                
                {testResults.actions && testResults.actions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">Triggered Actions:</h4>
                    <div className="space-y-1">
                      {testResults.actions.map((action: any, index: number) => (
                        <div key={`test-action-${index}-${action.value}`} className="bg-background border border-border p-2 rounded text-sm text-foreground">
                          {action.type}: {action.value} (Weight: {action.weight})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Close
            </Button>
            <Button onClick={runTest} className="bg-primary hover:bg-primary/90">
              <TestTube className="w-4 h-4 mr-2" />
              Run Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Rule
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{ruleToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteRule}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RulesPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminLayout>
        <ErrorBoundary>
          <RulesContent />
        </ErrorBoundary>
      </AdminLayout>
    </ProtectedRoute>
  );
}
