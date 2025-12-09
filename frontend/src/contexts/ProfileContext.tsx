"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../lib/api';
import { UserProfile, ProfileFormData, ProfileContextType } from '../types/profile';
import { useAuth } from './AuthContext';

// Declare global window property for registration data
declare global {
  interface Window {
    registrationUserData?: any;
  }
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const fetchProfile = async () => {
    // Don't fetch profile if not authenticated or no token available
    const token = localStorage.getItem('skillnavigator_token');
    if (!isAuthenticated || !token) {
      setLoading(false);
      setProfile(null);
      setNeedsProfile(false);
      setHasCompleteProfile(false);
      setCompletionPercentage(0);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First, always fetch user registration data
      let registrationData = null;
      try {
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          registrationData = userData.data?.user;
          console.log('Registration data:', registrationData);
        }
      } catch (userErr) {
        console.log('Could not fetch user registration data:', userErr);
      }
      
      const response = await profileAPI.getProfile();
      
      if (response.success) {
        if (response.data.profile) {
          let profileData = response.data.profile;
          
          // Debug logging
          console.log('🔍 Raw Profile Data from Backend:', JSON.stringify(profileData, null, 2));
          console.log('🎓 Education Data Specifically:', JSON.stringify(profileData.education, null, 2));
          console.log('📝 Education Array Check:', profileData.education?.education ? 'EXISTS' : 'MISSING');
          
          // Merge registration data with profile data for basic info
          if (registrationData) {
            profileData = {
              ...profileData,
              basicInfo: {
                ...profileData.basicInfo,
                // Use registration data as fallback for name and email
                fullName: profileData.basicInfo?.fullName || registrationData.name || '',
                name: profileData.basicInfo?.name || registrationData.name || '',
                email: registrationData.email || profileData.basicInfo?.email || '', // Email from registration (not editable)
              }
            };
          }
          
          console.log('✅ Final Profile Data after merge:', JSON.stringify(profileData, null, 2));
          
          setProfile(profileData);
          setNeedsProfile(false);
          setHasCompleteProfile(profileData.currentStatus?.isProfileComplete || false);
          setCompletionPercentage(response.data.completionPercentage || 0);
        } else {
          // No profile exists - store registration data for use in profile creation
          if (registrationData) {
            window.registrationUserData = registrationData;
          }
          
          setProfile(null);
          setNeedsProfile(true);
          setHasCompleteProfile(false);
          setCompletionPercentage(0);
        }
      } else {
        console.error('Profile fetch failed:', response.message);
        setError(response.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const transformProfileData = (formData: any) => {
    console.log('🔄 Transform Input:', JSON.stringify(formData, null, 2));
    let transformed = { ...formData };

    // Transform technical skills data
    if (formData.technicalSkills) {
      console.log('🛠️ Transforming technical skills...');
      const { technicalSkills } = formData;
      transformed.technicalSkills = {
        programmingLanguages: (technicalSkills.programmingLanguages || []).map((skill: any) => ({
          language: skill.name || skill.language,
          proficiency: (skill.level || skill.proficiency || 'beginner').toLowerCase()
        })),
        frameworks: (technicalSkills.frameworks || []).map((skill: any) => ({
          framework: skill.name || skill.framework,
          proficiency: (skill.level || skill.proficiency || 'beginner').toLowerCase()
        })),
        tools: (technicalSkills.tools || []).map((skill: any) => ({
          tool: skill.name || skill.tool,
          proficiency: (skill.level || skill.proficiency || 'beginner').toLowerCase()
        })),
        databases: (technicalSkills.databases || []).map((skill: any) => 
          typeof skill === 'string' ? skill : skill.name || skill.database || skill.tool || skill.framework || skill.language
        ),
        cloudPlatforms: (technicalSkills.cloudPlatforms || []).map((skill: any) => 
          typeof skill === 'string' ? skill : skill.name || skill.platform || skill.tool || skill.framework || skill.language
        )
      };
    }

    // Transform education data
    if (formData.education) {
      console.log('🎓 Transforming education data...');
      console.log('📚 Raw education input:', JSON.stringify(formData.education, null, 2));
      const { education } = formData;
      
      // Simple education structure - direct mapping
      transformed.education = {
        highestDegree: education.highestDegree || 'bachelor',
        fieldOfStudy: education.fieldOfStudy || '',
        institution: education.institution || '',
        graduationYear: education.graduationYear ? parseInt(education.graduationYear) : null,
        currentlyStudying: education.currentlyStudying || false,
        certifications: []
      };
    }

    // Transform career goals data
    if (formData.careerGoals) {
      console.log('🎯 Transforming career goals...');
      const { careerGoals } = formData;
      
      transformed.careerGoals = {
        targetRoles: careerGoals.desiredRole ? [careerGoals.desiredRole] : [],
        targetIndustries: careerGoals.targetIndustries || [],
        workLocationPreference: careerGoals.workLocationPreference || 'flexible',
        shortTermGoals: [],
        longTermGoals: []
      };
    } else {
      // Provide default career goals
      transformed.careerGoals = {
        targetRoles: [],
        targetIndustries: [],
        workLocationPreference: 'flexible',
        shortTermGoals: [],
        longTermGoals: []
      };
    }

    // Add default values for sections not in simplified flow
    if (!transformed.learningPreferences) {
      transformed.learningPreferences = {
        preferredLearningStyle: 'mixed',
        weeklyTimeCommitment: 10,
        preferredSchedule: 'flexible',
        resourceTypes: [],
        difficultyPreference: 'gradual'
      };
    }

    if (!transformed.interests) {
      transformed.interests = {
        primaryInterests: [],
        motivations: [],
        challengeAreas: [],
        inspirations: []
      };
    }

    if (!transformed.experience) {
      transformed.experience = {
        totalYears: 0,
        currentRole: '',
        industry: '',
        companySize: '',
        workType: '',
        workExperience: [],
        projects: [],
        achievements: ''
      };
    }

    console.log('✅ Transform Output:', JSON.stringify(transformed, null, 2));
    return transformed;
  };

  const updateProfile = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 UpdateProfile called');
      
      // Transform profile data to match backend schema
      const transformedData = transformProfileData(data);
      
      const response = await profileAPI.createOrUpdateProfile(transformedData);
      
      if (response.success) {
        setProfile(response.data.profile);
        setCompletionPercentage(response.data.completionPercentage);
        setNeedsProfile(false);
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to update profile';
        console.error('❌ Profile update failed:', response);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (step: number, data: any) => {
    try {
      setError(null);
      
      // Transform profile data if needed
      const transformedData = transformProfileData(data);
      
      const response = await profileAPI.updateProfileStep(step, transformedData);
      
      if (response.success) {
        setProfile(response.data.profile);
        setCompletionPercentage(response.data.completionPercentage);
        return response.data;
      } else {
        setError(response.message || 'Failed to update profile step');
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error updating profile step:', err);
      setError('Failed to update profile step');
      throw err;
    }
  };

  useEffect(() => {
    // Only fetch profile when auth loading is complete and user is authenticated
    if (!authLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    needsProfile,
    hasCompleteProfile,
    completionPercentage,
    fetchProfile,
    refreshProfile,
    updateProfile,
    updateStep,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};