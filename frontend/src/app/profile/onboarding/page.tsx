"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import BasicInfoStep from '@/components/profile/steps/BasicInfoStep';
import EducationStep from '@/components/profile/steps/EducationStepSimple';
import TechnicalSkillsStep from '@/components/profile/steps/TechnicalSkillsStep';
import CareerGoalsStep from '@/components/profile/steps/CareerGoalsStepSimple';
import { ProfileFormData } from '@/types/profile';

const STEPS = [
  { id: 1, title: 'Basic Information', component: BasicInfoStep },
  { id: 2, title: 'Education', component: EducationStep },
  { id: 3, title: 'Technical Skills', component: TechnicalSkillsStep },
  { id: 4, title: 'Career Goals', component: CareerGoalsStep },
];

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateStep, updateProfile, profile, completionPercentage } = useProfile();

  // Pre-populate form data with existing profile data
  useEffect(() => {
    if (profile && Object.keys(formData).length === 0) {
      setFormData({
        basicInfo: profile.basicInfo || {},
        education: profile.education || {},
        experience: profile.experience || {},
        technicalSkills: profile.technicalSkills || {},
        careerGoals: profile.careerGoals || {},
        interests: profile.interests || {},
        learningPreferences: profile.learningPreferences || {},
      });
    }
  }, [profile, formData]);

  const currentStepData = STEPS.find(step => step.id === currentStep);
  const StepComponent = currentStepData?.component;
  // Use actual completion percentage from backend, fallback to step-based calculation
  const progress = completionPercentage || (currentStep / STEPS.length) * 100;

  const handleNext = async (stepData: any) => {
    try {
      const updatedFormData = { ...formData, ...stepData };
      setFormData(updatedFormData);

      // For now, skip individual step saving and save at the end
      // await updateStep(currentStep, stepData);

      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - complete profile
        await handleComplete(updatedFormData);
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async (finalData: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      await updateProfile(finalData);
      router.push('/profile?completed=true');
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/profile');
  };

  if (!StepComponent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="bg-card border-border max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Error Loading Step</h3>
            <p className="text-muted-foreground mb-4">Unable to load step {currentStep}. Please try again.</p>
            <Button onClick={() => router.push('/profile')} className="bg-primary hover:bg-primary/90">
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="bg-card/50 border-b border-border py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/profile')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <h1 className="text-xl font-semibold">Complete Your Profile</h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-muted/30 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">{currentStepData?.title}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{currentStepData?.title}</h2>
          <p className="text-muted-foreground">
            Step {currentStep} of {STEPS.length} - Fill in your information to get personalized recommendations
          </p>
        </div>

        {/* Step Component */}
        <div className="mb-8">
          <StepComponent
            data={formData}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={currentStep === 1}
            isLast={currentStep === STEPS.length}
          />
        </div>

        {/* Navigation */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Skip for Now
              </Button>

              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="border-border text-muted-foreground hover:bg-muted"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                
                <Button
                  form={`step-${currentStep}-form`}
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : currentStep === STEPS.length ? (
                    'Complete Profile'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}