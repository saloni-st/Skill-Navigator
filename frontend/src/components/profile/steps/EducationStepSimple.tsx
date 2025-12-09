"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

interface EducationStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface EducationForm {
  highestDegree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  currentlyStudying: boolean;
}

export default function EducationStep({ data, onNext, onPrev, isFirst, isLast }: EducationStepProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EducationForm>({
    defaultValues: data.education || {
      highestDegree: '',
      fieldOfStudy: '',
      institution: '',
      graduationYear: '',
      currentlyStudying: false
    }
  });

  const onSubmit = (formData: EducationForm) => {
    onNext({
      education: {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Education</h2>
        </div>
        <p className="text-muted-foreground">Tell us about your educational background</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Highest Degree */}
            <div className="space-y-2">
              <Label className="text-foreground">Highest Degree *</Label>
              <Select 
                value={watch('highestDegree')}
                onValueChange={(value) => setValue('highestDegree', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select your highest degree" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD/Doctorate</SelectItem>
                </SelectContent>
              </Select>
              {errors.highestDegree && (
                <span className="text-destructive text-sm">Please select your highest degree</span>
              )}
            </div>

            {/* Field of Study */}
            <div className="space-y-2">
              <Label className="text-foreground">Field of Study *</Label>
              <Input
                {...register('fieldOfStudy', { required: 'Field of study is required' })}
                placeholder="e.g., Computer Science, Business Administration"
                className="bg-background border-border text-foreground"
              />
              {errors.fieldOfStudy && (
                <span className="text-destructive text-sm">{errors.fieldOfStudy.message}</span>
              )}
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <Label className="text-foreground">Institution *</Label>
              <Input
                {...register('institution', { required: 'Institution is required' })}
                placeholder="e.g., VIT University, Delhi University"
                className="bg-background border-border text-foreground"
              />
              {errors.institution && (
                <span className="text-destructive text-sm">{errors.institution.message}</span>
              )}
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <Label className="text-foreground">Graduation Year *</Label>
              <Input
                {...register('graduationYear', { required: 'Graduation year is required' })}
                type="number"
                placeholder="e.g., 2024"
                min="1990"
                max="2030"
                className="bg-background border-border text-foreground"
              />
              {errors.graduationYear && (
                <span className="text-destructive text-sm">{errors.graduationYear.message}</span>
              )}
            </div>

            {/* Currently Studying */}
            <div className="flex items-center space-x-2">
              <input
                {...register('currentlyStudying')}
                type="checkbox"
                id="currentlyStudying"
                className="rounded border-border"
              />
              <Label htmlFor="currentlyStudying" className="text-foreground">
                I am currently studying
              </Label>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              {!isFirst && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrev}
                  className="border-border text-foreground hover:bg-accent"
                >
                  Previous
                </Button>
              )}
              <Button
                type="submit"
                className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLast ? 'Complete Profile' : 'Next'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}