"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Target } from 'lucide-react';

interface CareerGoalsStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface CareerGoalsForm {
  desiredRole: string;
  targetIndustries: string[];
  timeFrame: string;
  workLocationPreference: string;
}

const INDUSTRIES = [
  { id: 'technology', label: 'Technology' },
  { id: 'fintech', label: 'Financial Technology' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'startup', label: 'Startup' },
  { id: 'consulting', label: 'Consulting' }
];

export default function CareerGoalsStep({ data, onNext, onPrev, isFirst, isLast }: CareerGoalsStepProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CareerGoalsForm>({
    defaultValues: data.careerGoals || {
      desiredRole: '',
      targetIndustries: [],
      timeFrame: '',
      workLocationPreference: 'flexible'
    }
  });

  const [selectedIndustries, setSelectedIndustries] = React.useState<string[]>(
    data.careerGoals?.targetIndustries || []
  );

  const handleIndustryChange = (industryId: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedIndustries, industryId]
      : selectedIndustries.filter(id => id !== industryId);
    setSelectedIndustries(updated);
    setValue('targetIndustries', updated);
  };

  const onSubmit = (formData: CareerGoalsForm) => {
    onNext({
      careerGoals: {
        ...formData,
        targetIndustries: selectedIndustries
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Career Goals</h2>
        </div>
        <p className="text-muted-foreground">Tell us about your career aspirations</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Desired Role */}
            <div className="space-y-2">
              <Label className="text-foreground">Target Role *</Label>
              <Input
                {...register('desiredRole', { required: 'Target role is required' })}
                placeholder="e.g., Software Developer, Data Scientist, Product Manager"
                className="bg-background border-border text-foreground"
              />
              {errors.desiredRole && (
                <span className="text-destructive text-sm">{errors.desiredRole.message}</span>
              )}
            </div>

            {/* Target Industries */}
            <div className="space-y-3">
              <Label className="text-foreground">Target Industries (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((industry) => (
                  <div key={industry.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry.id}
                      checked={selectedIndustries.includes(industry.id)}
                      onCheckedChange={(checked) => handleIndustryChange(industry.id, checked as boolean)}
                    />
                    <Label htmlFor={industry.id} className="text-foreground text-sm">
                      {industry.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label className="text-foreground">Timeline to Achieve Goal *</Label>
              <Select 
                value={watch('timeFrame')}
                onValueChange={(value) => setValue('timeFrame', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="6-months">Within 6 months</SelectItem>
                  <SelectItem value="1-year">Within 1 year</SelectItem>
                  <SelectItem value="2-years">Within 2 years</SelectItem>
                  <SelectItem value="3-years">Within 3+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.timeFrame && (
                <span className="text-destructive text-sm">Please select a timeframe</span>
              )}
            </div>

            {/* Work Location Preference */}
            <div className="space-y-2">
              <Label className="text-foreground">Work Location Preference *</Label>
              <Select 
                value={watch('workLocationPreference')}
                onValueChange={(value) => setValue('workLocationPreference', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
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