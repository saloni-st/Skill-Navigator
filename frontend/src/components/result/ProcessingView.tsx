import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Brain, Target, X } from "lucide-react";
import { useState, useEffect } from "react";

interface ProcessingState {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  status: 'running' | 'completed' | 'error';
  allowCancel?: boolean;
}

interface ProcessingViewProps {
  processing: ProcessingState;
  onCancel?: () => void;
}

export function ProcessingView({ processing, onCancel }: ProcessingViewProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const targetProgress = (processing.currentStep / processing.totalSteps) * 100;
    setProgress(targetProgress);
  }, [processing.currentStep, processing.totalSteps]);

  const steps = [
    { id: 1, name: "Running inference", icon: Target },
    { id: 2, name: "Refining with AI (optional)", icon: Brain }
  ];

  const getStepStatus = (stepId: number) => {
    if (stepId < processing.currentStep) return 'completed';
    if (stepId === processing.currentStep) return processing.status === 'error' ? 'error' : 'running';
    return 'pending';
  };

  const getStepIcon = (stepId: number, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        const IconComponent = steps.find(s => s.id === stepId)?.icon || Clock;
        return <IconComponent className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            Processing Your Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {processing.currentStep} of {processing.totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Current Step */}
          <div className="text-center">
            <p className="text-lg font-medium">{processing.stepName}</p>
            {processing.status === 'error' && (
              <p className="text-red-600 text-sm mt-1">
                An error occurred during processing
              </p>
            )}
          </div>

          {/* Step List */}
          <div className="space-y-3">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    status === 'running' ? 'bg-blue-50' : 
                    status === 'completed' ? 'bg-green-50' : 
                    status === 'error' ? 'bg-red-50' : 
                    'bg-gray-50'
                  }`}
                >
                  {getStepIcon(step.id, status)}
                  <span className={`flex-1 ${
                    status === 'completed' ? 'text-green-700' :
                    status === 'error' ? 'text-red-700' :
                    status === 'running' ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cancel Button */}
          {processing.allowCancel && onCancel && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-gray-600"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Don't navigate away during processing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}