import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  RefreshCw,
  Info
} from "lucide-react";
import { useState } from "react";

interface ConfidencePillProps {
  confidence: number;
  confidenceBreakdown: any;
}

export function ConfidencePill({ confidence, confidenceBreakdown }: ConfidencePillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "bg-green-500";
    if (conf >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceColorText = (conf: number) => {
    if (conf >= 0.8) return "text-green-700";
    if (conf >= 0.6) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className={`${getConfidenceColorText(confidence)} border-current`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-2 h-2 rounded-full mr-2 ${getConfidenceColor(confidence)}`} />
        Confidence: {Math.round(confidence * 100)}%
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </Button>
      {isExpanded && (
        <div className="absolute top-full left-0 z-10 mt-2 w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Confidence Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Coverage:</span>
                <span>{Math.round(confidenceBreakdown.coverage * 100)}%</span>
              </div>
              {confidenceBreakdown.breakdown?.map((rule: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{rule.ruleName || `Rule ${index + 1}`}:</span>
                  <span className={rule.matched ? "text-green-600" : "text-gray-500"}>
                    {rule.matched ? `+${Math.round(rule.score * 100)}%` : "No match"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface LlmStatusIndicatorProps {
  llmStatus: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function LlmStatusIndicator({ llmStatus, onRetry, isRetrying }: LlmStatusIndicatorProps) {
  if (llmStatus === "success") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Brain className="w-3 h-3 mr-1" />
        Refined by LLM
      </Badge>
    );
  }

  if (llmStatus === "not_used") {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Info className="w-3 h-3 mr-1" />
        Rule-based
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        AI Unavailable
      </Badge>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Retry AI
        </Button>
      )}
    </div>
  );
}

interface ProcessingStepsProps {
  processing: any;
}

export function ProcessingSteps({ processing }: ProcessingStepsProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Processing Steps:</h4>
      {processing.stepDetails?.map((step: any) => (
        <div key={step.step} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStepIcon(step.status)}
            <span>{step.name}</span>
          </div>
          <span className="text-gray-500">{step.duration}</span>
        </div>
      ))}
    </div>
  );
}