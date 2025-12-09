"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, MapPin, Calendar } from 'lucide-react';

interface BasicInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface BasicInfoForm {
  fullName: string;
  name: string;
  email: string;
  age: string;
  location: string;
  currentRole: string;
  experience: string;
}

export default function BasicInfoStep({ data, onNext, onPrev, isFirst, isLast }: BasicInfoStepProps) {
  // Combine all available data sources
  const getInitialFormData = (): BasicInfoForm => {
    return {
      fullName: data.basicInfo?.fullName || data.basicInfo?.name || '',
      name: data.basicInfo?.name || data.basicInfo?.fullName || '',
      email: data.basicInfo?.email || '',
      age: data.basicInfo?.age?.toString() || '',
      location: data.basicInfo?.location || '',
      currentRole: data.experience?.currentRole || data.basicInfo?.currentRole || '',
      experience: data.experience?.totalYears?.toString() || data.basicInfo?.experience?.toString() || ''
    };
  };

  const [initialData, setInitialData] = useState<BasicInfoForm>(getInitialFormData());
  
  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<BasicInfoForm>({
    defaultValues: initialData
  });

  const watchedExperience = watch('experience');

  // Update form when data changes
  useEffect(() => {
    const newFormData = getInitialFormData();
    setInitialData(newFormData);
    reset(newFormData);
  }, [data.basicInfo, reset]);

  // Fetch and populate registration data if needed
  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        // If basic info is not available, fetch from registration
        if (!data.basicInfo?.fullName || !data.basicInfo?.email) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('skillnavigator_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            const registrationData = userData.data?.user;
            
            if (registrationData) {
              const populatedData = {
                fullName: data.basicInfo?.fullName || registrationData.name || '',
                name: data.basicInfo?.name || registrationData.name || '',
                email: registrationData.email || data.basicInfo?.email || '',
                age: data.basicInfo?.age?.toString() || '',
                location: data.basicInfo?.location || '',
                currentRole: data.experience?.currentRole || data.basicInfo?.currentRole || '',
                experience: data.experience?.totalYears?.toString() || data.basicInfo?.experience?.toString() || ''
              };
              
              setInitialData(populatedData);
              reset(populatedData); // Reset form with new data
            }
          }
        }
      } catch (error) {
        console.error('Error fetching registration data:', error);
      }
    };

    // Only fetch registration data if we don't have profile data
    if (!data.basicInfo?.fullName && !data.basicInfo?.email) {
      fetchRegistrationData();
    }
  }, [data.basicInfo, reset]);

  const onSubmit = (formData: BasicInfoForm) => {
    console.log('BasicInfoStep - Form submitted with data:', formData);
    
    // Enhanced validation and data transformation
    const enhancedData = {
      basicInfo: {
        fullName: formData.fullName.trim(),
        name: formData.name.trim() || formData.fullName.trim(),
        email: formData.email.trim(),
        age: formData.age ? parseInt(formData.age) : undefined,
        location: formData.location?.trim() || undefined,
        profileCompleteness: calculateCompleteness(formData),
        // Add metadata for LLM enhancement
        dataQuality: {
          hasAge: !!formData.age,
          hasLocation: !!formData.location,
          hasCurrentRole: !!formData.currentRole,
          completenessScore: calculateCompleteness(formData)
        }
      },
      experience: {
        currentRole: formData.currentRole?.trim() || undefined,
        totalYears: formData.experience ? parseInt(formData.experience) : 0,
        // Enhanced mapping for LLM
        experienceLevel: inferExperienceLevel(parseInt(formData.experience || '0')),
        hasWorkExperience: parseInt(formData.experience || '0') > 0
      }
    };
    
    console.log('Enhanced data being passed:', enhancedData);
    onNext(enhancedData);
  };
  
  const calculateCompleteness = (formData: BasicInfoForm): number => {
    const requiredFields = [formData.fullName, formData.email];
    const optionalFields = [formData.age, formData.location, formData.currentRole, formData.experience];
    
    const requiredCompleted = requiredFields.filter(field => field && field.trim()).length;
    const optionalCompleted = optionalFields.filter(field => field && field.trim()).length;
    
    // Weight required fields more heavily
    const score = (requiredCompleted / requiredFields.length) * 60 + (optionalCompleted / optionalFields.length) * 40;
    return Math.round(score);
  };
  
  const inferExperienceLevel = (years: number): string => {
    if (years === 0) return 'beginner';
    if (years <= 2) return 'some_experience';
    if (years <= 5) return 'intermediate';
    if (years <= 10) return 'advanced';
    return 'expert';
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="profile-step-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                {...register('fullName', { required: 'Full name is required' })}
                placeholder="Enter your full name"
                className="bg-background border-border text-foreground"
              />
              {errors.fullName && (
                <p className="text-destructive text-sm">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
                <span className="text-xs text-muted-foreground ml-2">
                  (From registration)
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="Enter your email"
                className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                readOnly
                disabled
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Age
              </Label>
              <Input
                id="age"
                type="number"
                {...register('age')}
                placeholder="Enter your age"
                className="bg-background border-border text-foreground"
                min="16"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="City, Country"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRole" className="text-foreground">
                Current Role/Position
              </Label>
              <Input
                id="currentRole"
                {...register('currentRole')}
                placeholder="e.g., Software Developer, Student, etc."
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-foreground">
                Years of Experience
              </Label>
              <Select 
                onValueChange={(value) => setValue('experience', value)}
                value={watchedExperience || undefined}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="0">0 years (Fresher)</SelectItem>
                  <SelectItem value="1">1 year</SelectItem>
                  <SelectItem value="2">2 years</SelectItem>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="4">4 years</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="6">6+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Education
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}