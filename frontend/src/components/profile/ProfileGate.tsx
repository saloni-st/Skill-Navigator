"use client";

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileOnboardingModal from './ProfileOnboardingModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Settings, BarChart3, CheckCircle } from 'lucide-react';

interface ProfileGateProps {
  children: React.ReactNode;
  requiredForAssessment?: boolean;
}

export default function ProfileGate({ children, requiredForAssessment = true }: ProfileGateProps) {
  const { profile, loading, hasCompleteProfile, refreshProfile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!loading && !hasChecked) {
        await refreshProfile();
        setHasChecked(true);
        
        if (requiredForAssessment && !hasCompleteProfile) {
          setShowOnboarding(true);
        }
      }
    };

    checkProfile();
  }, [loading, hasCompleteProfile, requiredForAssessment, refreshProfile, hasChecked]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refreshProfile();
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If profile is not complete and required for assessment, show the prompt
  if (requiredForAssessment && !hasCompleteProfile && !showOnboarding) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-purple-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white">
                Complete Your Profile
              </h2>
              
              <p className="text-slate-400 text-lg leading-relaxed">
                To provide you with the most personalized learning recommendations, 
                we need to know more about your background, skills, and goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Personal Info</h3>
                <p className="text-sm text-slate-400">
                  Basic information about you and your experience
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto">
                  <Settings className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Skills & Goals</h3>
                <p className="text-sm text-slate-400">
                  Your technical skills and career objectives
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white">Preferences</h3>
                <p className="text-sm text-slate-400">
                  Learning style and personal interests
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleStartOnboarding}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full py-3 text-lg"
              >
                Get Started (5-10 minutes)
              </Button>
              
              <p className="text-sm text-slate-500">
                Don't worry - you can always update your profile later!
              </p>
            </div>
          </CardContent>
        </Card>

        <ProfileOnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />
      </div>
    );
  }

  // If profile is complete or not required, show the children
  return (
    <>
      {children}
      
      {/* Show onboarding modal if explicitly triggered */}
      <ProfileOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}