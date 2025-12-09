import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  RefreshCw,
  Info,
  Eye,
  Code2,
  Target,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { EnhancedResult } from "@/types/api";
import { ConfidencePill, LlmStatusIndicator, ProcessingSteps } from "./ResultComponents";

interface EnhancedResultViewProps {
  result: EnhancedResult;
  onRetryLlm?: () => void;
  isRetrying?: boolean;
  isAdmin?: boolean;
}

export function EnhancedResultView({ 
  result, 
  onRetryLlm, 
  isRetrying = false,
  isAdmin = false 
}: EnhancedResultViewProps) {
  const [viewMode, setViewMode] = useState<'llm' | 'base'>('llm');
  const [showDebug, setShowDebug] = useState(false);

  const hasLlmRecommendation = result.llmStatus === 'success' && result.llmRecommendation;
  const showFallbackBanner = result.llmStatus !== 'success' && result.llmStatus !== 'not_used';
  // Handle confidence as number or object
  const confidenceValue = typeof result.confidence === 'number' ? result.confidence : result.confidence?.score || 0;
  const isLowConfidence = confidenceValue < 0.6;

  return (
    <div className="space-y-6">
      {/* Status and Confidence Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LlmStatusIndicator 
            llmStatus={result.llmStatus}
            onRetry={onRetryLlm}
            isRetrying={isRetrying}
          />
          <ConfidencePill 
            confidence={confidenceValue}
            confidenceBreakdown={result.confidenceBreakdown}
          />
        </div>
        
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Code2 className="w-4 h-4 mr-1" />
            Debug
          </Button>
        )}
      </div>

      {/* Fallback Banner */}
      {showFallbackBanner && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Detailed roadmap unavailable;</strong> showing rule-based skeleton. 
            The AI enhancement failed, but your core recommendations are still accurate.
          </AlertDescription>
        </Alert>
      )}

      {/* Low Confidence Warning */}
      {isLowConfidence && (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            This plan has low confidence ({Math.round(confidenceValue * 100)}%). 
            Consider retaking the questionnaire with more detailed responses for better recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Content View Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'llm' | 'base')}>
        <TabsList>
          <TabsTrigger value="llm" disabled={!hasLlmRecommendation}>
            <Brain className="w-4 h-4 mr-2" />
            {hasLlmRecommendation ? 'LLM Enhanced' : 'AI Unavailable'}
          </TabsTrigger>
          <TabsTrigger value="base">
            <Target className="w-4 h-4 mr-2" />
            Rule-based View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="mt-6">
          {hasLlmRecommendation ? (
            <LlmRecommendationView recommendation={result.llmRecommendation} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>LLM enhancement is not available for this result.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="base" className="mt-6">
          <BaseRecommendationView 
            recommendation={result.baseRecommendation}
            trace={result.trace}
          />
        </TabsContent>
      </Tabs>

      {/* Processing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Processing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProcessingSteps processing={result.processing} />
        </CardContent>
      </Card>

      {/* Admin Debug View */}
      {isAdmin && showDebug && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-700">Admin Debug View</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface LlmRecommendationViewProps {
  recommendation: any;
}

function LlmRecommendationView({ recommendation }: LlmRecommendationViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI-Enhanced Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendation.roadmap ? (
          <div className="space-y-4">
            {Array.isArray(recommendation.roadmap) ? (
              recommendation.roadmap.map((phase: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">{phase.phase || `Phase ${index + 1}`}</h4>
                  <p className="text-gray-600 text-sm">{phase.description}</p>
                  {phase.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {phase.skills.map((skill: string, skillIndex: number) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="prose max-w-none">
                <p>{recommendation.roadmap}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No detailed roadmap available.</p>
        )}
      </CardContent>
    </Card>
  );
}

interface BaseRecommendationViewProps {
  recommendation: any;
  trace: any[];
}

function BaseRecommendationView({ recommendation, trace }: BaseRecommendationViewProps) {
  return (
    <div className="space-y-6">
      {/* Base Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Rule-based Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendation ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-gray-700">{recommendation.summary}</p>
              </div>
              
              {recommendation.recommendedPath && (
                <div>
                  <h4 className="font-semibold mb-2">Recommended Path</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.recommendedPath.map((step: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {index + 1}. {step}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Difficulty Level</h4>
                  <Badge variant="secondary">{recommendation.difficulty}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Estimated Timeframe</h4>
                  <Badge variant="outline">{recommendation.estimatedTimeframe}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No base recommendation available.</p>
          )}
        </CardContent>
      </Card>

      {/* Rule Trace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rule Application Trace
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trace && trace.length > 0 ? (
            <div className="space-y-3">
              {trace.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{step.step || `Step ${index + 1}`}</h4>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    {step.result && (
                      <div className="mt-2 text-xs text-gray-500">
                        Result: {typeof step.result === 'string' ? step.result : JSON.stringify(step.result)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No trace information available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}