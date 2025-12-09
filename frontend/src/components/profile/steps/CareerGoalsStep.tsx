"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, TrendingUp, MapPin, Calendar, Briefcase } from 'lucide-react';

interface CareerGoalsStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface CareerGoalsForm {
  currentCareerStage: string;
  desiredRole: string;
  careerObjectives: string[];
  targetIndustries: string[];
  timeFrame: string;
  specificGoals: string;
  challenges: string;
  skillGaps: string;
  mentorshipInterest: string;
  networkingGoals: string;
  salaryExpectations?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

const CAREER_OBJECTIVES = [
  { id: 'promotion', label: 'Get promoted in current role' },
  { id: 'career-change', label: 'Change career paths completely' },
  { id: 'skill-upgrade', label: 'Upgrade technical skills' },
  { id: 'leadership', label: 'Move into leadership/management' },
  { id: 'specialization', label: 'Specialize in a specific area' },
  { id: 'freelance', label: 'Become a freelancer/consultant' },
  { id: 'entrepreneurship', label: 'Start my own business/startup' },
  { id: 'remote-work', label: 'Transition to remote work' },
  { id: 'salary-increase', label: 'Increase salary/compensation' },
  { id: 'work-life-balance', label: 'Achieve better work-life balance' }
];

const TARGET_INDUSTRIES = [
  { id: 'technology', label: 'Technology/Software' },
  { id: 'finance', label: 'Finance/FinTech' },
  { id: 'healthcare', label: 'Healthcare/MedTech' },
  { id: 'education', label: 'Education/EdTech' },
  { id: 'ecommerce', label: 'E-commerce/Retail' },
  { id: 'gaming', label: 'Gaming/Entertainment' },
  { id: 'automotive', label: 'Automotive/Transportation' },
  { id: 'energy', label: 'Energy/Clean Tech' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'startup', label: 'Startups' },
  { id: 'enterprise', label: 'Large Enterprises' },
  { id: 'government', label: 'Government/Public Sector' }
];

export default function CareerGoalsStep({ data, onNext, onPrev, isFirst, isLast }: CareerGoalsStepProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CareerGoalsForm>({
    defaultValues: data.careerGoals || {
      currentCareerStage: '',
      desiredRole: '',
      careerObjectives: [],
      targetIndustries: [],
      timeFrame: '',
      specificGoals: '',
      challenges: '',
      skillGaps: '',
      mentorshipInterest: '',
      networkingGoals: '',
      salaryExpectations: { min: undefined, max: undefined, currency: 'INR' }
    }
  });

  const watchedData = watch();

  const handleCheckboxChange = (field: 'careerObjectives' | 'targetIndustries', value: string, checked: boolean) => {
    const currentValues = watchedData[field] || [];
    let updatedValues;
    
    if (checked) {
      updatedValues = [...currentValues, value];
    } else {
      updatedValues = currentValues.filter((item: string) => item !== value);
    }
    
    setValue(field, updatedValues);
  };

  const onSubmit = (formData: CareerGoalsForm) => {
  // Ensure salaryExpectations is always an object
  const salary = formData.salaryExpectations || { min: undefined, max: undefined, currency: 'INR' };
  onNext({ careerGoals: { ...formData, salaryExpectations: salary } });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Current Career Stage */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold text-foreground">Current Career Stage</Label>
            </div>
            
            <Select onValueChange={(value) => setValue('currentCareerStage', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Where are you in your career?" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="student">Student/Recent Graduate</SelectItem>
                <SelectItem value="entry-level">Entry Level (0-2 years)</SelectItem>
                <SelectItem value="junior">Junior Professional (2-4 years)</SelectItem>
                <SelectItem value="mid-level">Mid-Level Professional (4-7 years)</SelectItem>
                <SelectItem value="senior">Senior Professional (7-10 years)</SelectItem>
                <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                <SelectItem value="manager">Manager/Director</SelectItem>
                <SelectItem value="executive">Executive/C-Level</SelectItem>
                <SelectItem value="career-changer">Career Changer</SelectItem>
                <SelectItem value="returning">Returning to workforce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desired Role */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              <Label htmlFor="desiredRole" className="text-lg font-semibold text-foreground">Desired Role/Position</Label>
            </div>
            <Input
              id="desiredRole"
              {...register('desiredRole')}
              placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Career Objectives */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">Career Objectives</Label>
            <p className="text-muted-foreground text-sm">What are your main career goals? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CAREER_OBJECTIVES.map((objective) => (
                <div key={objective.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={objective.id}
                    checked={watchedData.careerObjectives?.includes(objective.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('careerObjectives', objective.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={objective.id} className="text-foreground text-sm">{objective.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Target Industries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <Label className="text-lg font-semibold text-foreground">Target Industries</Label>
            </div>
            <p className="text-muted-foreground text-sm">Which industries interest you? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TARGET_INDUSTRIES.map((industry) => (
                <div key={industry.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={industry.id}
                    checked={watchedData.targetIndustries?.includes(industry.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('targetIndustries', industry.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={industry.id} className="text-foreground text-sm">{industry.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Frame */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold text-foreground">Timeline for Goals</Label>
            </div>
            <p className="text-muted-foreground text-sm">When do you want to achieve your main career goals?</p>
            
            <Select onValueChange={(value) => setValue('timeFrame', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="3-months">Within 3 months</SelectItem>
                <SelectItem value="6-months">Within 6 months</SelectItem>
                <SelectItem value="1-year">Within 1 year</SelectItem>
                <SelectItem value="2-years">Within 2 years</SelectItem>
                <SelectItem value="3-5-years">3-5 years</SelectItem>
                <SelectItem value="5-plus-years">5+ years</SelectItem>
                <SelectItem value="flexible">Flexible timeline</SelectItem>
              </SelectContent>
            </Select>
            {/* Salary Expectations */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Salary Expectations (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min Salary"
                  {...register('salaryExpectations.min', { valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max Salary"
                  {...register('salaryExpectations.max', { valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                />
                <Select onValueChange={(value) => setValue('salaryExpectations.currency', value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Salary Expectations */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Salary Expectations (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min Salary"
                  {...register('salaryExpectations.min', { valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max Salary"
                  {...register('salaryExpectations.max', { valueAsNumber: true })}
                  className="bg-background border-border text-foreground"
                />
                <Select onValueChange={(value) => setValue('salaryExpectations.currency', value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Specific Goals */}
          <div className="space-y-2">
            <Label htmlFor="specificGoals" className="text-foreground">Specific Career Goals</Label>
            <Textarea
              id="specificGoals"
              {...register('specificGoals')}
              placeholder="Describe your specific career goals, aspirations, or what success looks like to you..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          {/* Current Challenges */}
          <div className="space-y-2">
            <Label htmlFor="challenges" className="text-foreground">Current Career Challenges</Label>
            <Textarea
              id="challenges"
              {...register('challenges')}
              placeholder="What obstacles or challenges are you facing in your career right now?"
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          {/* Skill Gaps */}
          <div className="space-y-2">
            <Label htmlFor="skillGaps" className="text-foreground">Identified Skill Gaps</Label>
            <Textarea
              id="skillGaps"
              {...register('skillGaps')}
              placeholder="What skills do you feel you need to develop to reach your career goals?"
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          {/* Additional Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Mentorship Interest</Label>
              <Select onValueChange={(value) => setValue('mentorshipInterest', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Interested in mentorship?" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="seeking-mentor">Looking for a mentor</SelectItem>
                  <SelectItem value="willing-to-mentor">Willing to mentor others</SelectItem>
                  <SelectItem value="both">Both seeking and offering mentorship</SelectItem>
                  <SelectItem value="peer-mentorship">Interested in peer mentorship</SelectItem>
                  <SelectItem value="not-interested">Not interested in mentorship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="networkingGoals" className="text-foreground">Networking Goals</Label>
              <Textarea
                id="networkingGoals"
                {...register('networkingGoals')}
                placeholder="What are your networking goals or professional connections you'd like to make?"
                className="bg-background border-border text-foreground"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Interests
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
