"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { ProfileFormData } from '../../types/profile';

// Import step components
import BasicInfoStep from './steps/BasicInfoStep';
import EducationStep from './steps/EducationStep';
import ExperienceStep from './steps/ExperienceStep';
import TechnicalSkillsStep from './steps/TechnicalSkillsStep';
import LearningPreferencesStep from './steps/LearningPreferencesStep';
import CareerGoalsStep from './steps/CareerGoalsStep';
import InterestsStep from './steps/InterestsStep';

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Information', component: BasicInfoStep },
  { id: 2, title: 'Education', component: EducationStep },
  { id: 3, title: 'Experience', component: ExperienceStep },
  { id: 4, title: 'Technical Skills', component: TechnicalSkillsStep },
  { id: 5, title: 'Learning Preferences', component: LearningPreferencesStep },
  { id: 6, title: 'Career Goals', component: CareerGoalsStep },
  { id: 7, title: 'Interests & Motivations', component: InterestsStep },
];

export default function ProfileOnboardingModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: ProfileOnboardingModalProps) {
  console.log('🔵 ProfileOnboardingModal rendered - isOpen:', isOpen);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateStep, updateProfile } = useProfile();

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = STEPS.find(step => step.id === currentStep);
  const StepComponent = currentStepData?.component;
  const progress = (currentStep / STEPS.length) * 100;

  console.log('Current step:', currentStep, 'StepComponent:', StepComponent, 'currentStepData:', currentStepData);

  const handleNext = async (stepData: any) => {
    try {
      console.log('📝 Processing step data:', stepData);
      
      const updatedFormData = { ...formData, ...stepData };
      setFormData(updatedFormData);

      // Calculate completion metrics for enhanced LLM mapping
      const completionMetrics = calculateCompletionMetrics(updatedFormData, currentStep);
      console.log('📊 Completion metrics:', completionMetrics);

      // Enhanced step data with completion tracking
      const enhancedStepData = {
        ...stepData,
        stepMetadata: {
          stepNumber: currentStep,
          stepTitle: currentStepData?.title,
          completionTimestamp: new Date().toISOString(),
          completionMetrics,
          profileQuality: assessProfileQuality(updatedFormData)
        }
      };

      // Save step data to backend with enhanced metadata
      await updateStep(currentStep, enhancedStepData);

      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - complete profile with comprehensive data
        await handleComplete(updatedFormData, completionMetrics);
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const calculateCompletionMetrics = (formData: ProfileFormData, currentStepNum: number) => {
    const totalSteps = STEPS.length;
    const completedSteps = currentStepNum;
    const stepCompletionPercentage = (completedSteps / totalSteps) * 100;
    
    // Calculate field completion across all steps
    const allFields = extractAllFields(formData);
    const completedFields = allFields.filter(field => field !== null && field !== undefined && field !== '').length;
    const fieldCompletionPercentage = allFields.length > 0 ? (completedFields / allFields.length) * 100 : 0;
    
    return {
      stepProgress: stepCompletionPercentage,
      fieldCompletion: fieldCompletionPercentage,
      overallCompletion: (stepCompletionPercentage + fieldCompletionPercentage) / 2,
      completedSteps: completedSteps,
      totalSteps: totalSteps,
      completedFields: completedFields,
      totalFields: allFields.length,
      dataRichness: assessDataRichness(formData)
    };
  };

  const extractAllFields = (formData: ProfileFormData): any[] => {
    const fields: any[] = [];
    
    // Basic info fields
    if (formData.basicInfo) {
      fields.push(
        formData.basicInfo.fullName,
        formData.basicInfo.email,
        formData.basicInfo.age,
        formData.basicInfo.location
      );
    }
    
    // Education fields
    if (formData.education) {
      fields.push(
        formData.education.highestDegree,
        formData.education.fieldOfStudy,
        formData.education.graduationYear
      );
    }
    
    // Experience fields
    if (formData.experience) {
      fields.push(
        formData.experience.totalYears,
        formData.experience.currentRole,
        formData.experience.industry
      );
    }
    
    // Technical skills
    if (formData.technicalSkills) {
      fields.push(
        ...(formData.technicalSkills.programmingLanguages || []),
        ...(formData.technicalSkills.frameworks || []),
        ...(formData.technicalSkills.databases || [])
      );
    }
    
    // Learning preferences
    if (formData.learningPreferences) {
      fields.push(
        formData.learningPreferences.preferredLearningStyle,
        formData.learningPreferences.timeCommitment,
        formData.learningPreferences.preferredSchedule // changed from schedule
      );
    }
    
    // Career goals
    if (formData.careerGoals) {
      fields.push(
        formData.careerGoals.desiredRole, // changed from primary
        ...(formData.careerGoals.careerObjectives || []) // changed from shortTerm/longTerm
      );
    }
    
    return fields;
  };

  const assessDataRichness = (formData: ProfileFormData): string => {
    const sections = [
      formData.basicInfo,
      formData.education,
      formData.experience,
      formData.technicalSkills,
      formData.learningPreferences,
      formData.careerGoals,
      formData.interests
    ];
    
    const completedSections = sections.filter(section => section && Object.keys(section).length > 0).length;
    const completionRatio = completedSections / sections.length;
    
    if (completionRatio >= 0.8) return 'rich';
    if (completionRatio >= 0.6) return 'moderate';
    if (completionRatio >= 0.4) return 'basic';
    return 'minimal';
  };

  const assessProfileQuality = (formData: ProfileFormData): { 
    score: number; 
    level: string; 
    recommendations: string[] 
  } => {
    let score = 0;
    const recommendations: string[] = [];
    
  // Basic info scoring (20 points)
  if (formData.basicInfo?.fullName) score += 5;
  if (formData.basicInfo?.email) score += 5;
  if (formData.basicInfo?.age) score += 5;
  if (formData.basicInfo?.location) score += 5;
  else recommendations.push("Complete basic information for better recommendations");
    
  // Education scoring (10 points)
  if (formData.education?.highestDegree) score += 5;
  if (formData.education?.fieldOfStudy) score += 5;
  else recommendations.push("Add education details for academic context");
    
    // Experience scoring (20 points)
    if (formData.experience?.totalYears !== undefined) score += 5;
    if (formData.experience?.currentRole) score += 5;
    if (formData.experience?.industry) score += 5;
    if (formData.experience?.workType) score += 5;
    else recommendations.push("Include work experience for career-focused suggestions");
    
    // Technical skills scoring (20 points)
    const skillsCount = (formData.technicalSkills?.programmingLanguages?.length || 0) +
                       (formData.technicalSkills?.frameworks?.length || 0) +
                       (formData.technicalSkills?.databases?.length || 0);
    if (skillsCount >= 5) score += 20;
    else if (skillsCount >= 3) score += 15;
    else if (skillsCount >= 1) score += 10;
    else recommendations.push("Add technical skills for personalized learning paths");
    
  // Learning preferences scoring (10 points)
  if (formData.learningPreferences?.preferredLearningStyle) score += 3;
  if (formData.learningPreferences?.timeCommitment) score += 3;
  if (formData.learningPreferences?.preferredSchedule) score += 4; // changed from schedule
  else recommendations.push("Set learning preferences for optimized scheduling");
    
  // Career goals scoring (10 points)
  if (formData.careerGoals?.desiredRole) score += 5; // changed from primary
  if (formData.careerGoals?.careerObjectives?.length) score += 5; // sum for objectives
  else recommendations.push("Define career goals for targeted skill development");
    
    let level = 'minimal';
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    
    return { score, level, recommendations };
  };

  const handleComplete = async (finalData: ProfileFormData, completionMetrics?: any) => {
    try {
      setIsSubmitting(true);
      
      console.log('🎯 Completing profile with comprehensive data:', finalData);
      console.log('📊 Final completion metrics:', completionMetrics);
      
      // Enhanced final data with completion metrics
      const enhancedFinalData = {
        ...finalData,
        profileMetadata: {
          completedAt: new Date().toISOString(),
          completionMetrics: completionMetrics,
          profileQuality: assessProfileQuality(finalData),
          dataVersion: '2.0', // Enhanced version for better LLM mapping
          enhancedForLLM: true
        }
      };
      
      await updateProfile(enhancedFinalData);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!StepComponent) {
    console.error('StepComponent not found for step:', currentStep);
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <div className="text-center text-white p-8">
            <h3 className="text-xl font-semibold mb-4">Error Loading Step</h3>
            <p className="text-slate-400 mb-4">Unable to load step {currentStep}. Please try again.</p>
            <button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white">
              Complete Your Profile
            </DialogTitle>
            <div className="text-sm text-slate-400">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-slate-400">
              {currentStepData?.title} - {Math.round(progress)}% complete
            </p>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              {currentStepData?.title}
            </h3>
            <p className="text-slate-400 text-sm">
              This information helps us create personalized learning recommendations for you.
            </p>
          </div>

          <StepComponent
            data={formData}
            onNext={handleNext}
            onPrev={currentStep > 1 ? handlePrev : undefined}
            isFirst={currentStep === 1}
            isLast={currentStep === STEPS.length}
          />
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-700">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white"
            >
              Skip for now
            </Button>
            
            <Button
              type="submit"
              form="profile-step-form"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                'Saving...'
              ) : currentStep === STEPS.length ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Profile
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}