"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Zap, Star, Coffee, Users, Lightbulb } from 'lucide-react';

interface InterestsStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface InterestsForm {
  technicalInterests: string[];
  industryInterests: string[];
  workEnvironmentPreference: string;
  motivations: string[];
  personalityTraits: string[];
  hobbiesAndInterests: string;
  learningMotivation: string;
  workLifeBalance: string;
  additionalInfo?: string;
}

const TECHNICAL_INTERESTS = [
  { id: 'web-development', label: 'Web Development' },
  { id: 'mobile-development', label: 'Mobile App Development' },
  { id: 'data-science', label: 'Data Science & Analytics' },
  { id: 'machine-learning', label: 'Machine Learning & AI' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'cloud-computing', label: 'Cloud Computing' },
  { id: 'devops', label: 'DevOps & Infrastructure' },
  { id: 'blockchain', label: 'Blockchain & Cryptocurrency' },
  { id: 'iot', label: 'Internet of Things (IoT)' },
  { id: 'game-development', label: 'Game Development' },
  { id: 'ui-ux', label: 'UI/UX Design' },
  { id: 'embedded-systems', label: 'Embedded Systems' }
];

const INDUSTRY_INTERESTS = [
  { id: 'fintech', label: 'Financial Technology' },
  { id: 'healthtech', label: 'Health & Medical Technology' },
  { id: 'edtech', label: 'Education Technology' },
  { id: 'sustainability', label: 'Sustainability & Green Tech' },
  { id: 'social-impact', label: 'Social Impact & Non-profit' },
  { id: 'entertainment', label: 'Entertainment & Media' },
  { id: 'automotive', label: 'Automotive & Transportation' },
  { id: 'aerospace', label: 'Aerospace & Defense' },
  { id: 'agriculture', label: 'Agriculture & Food Tech' },
  { id: 'fashion', label: 'Fashion & E-commerce' },
  { id: 'travel', label: 'Travel & Hospitality' },
  { id: 'sports', label: 'Sports & Fitness' }
];

const MOTIVATIONS = [
  { id: 'problem-solving', label: 'Solving complex problems' },
  { id: 'creating', label: 'Building and creating things' },
  { id: 'helping-others', label: 'Helping others through technology' },
  { id: 'innovation', label: 'Being at the forefront of innovation' },
  { id: 'financial-stability', label: 'Financial stability and growth' },
  { id: 'work-flexibility', label: 'Work flexibility and freedom' },
  { id: 'recognition', label: 'Professional recognition and status' },
  { id: 'learning', label: 'Continuous learning and growth' },
  { id: 'leadership', label: 'Leading teams and projects' },
  { id: 'entrepreneurship', label: 'Entrepreneurial opportunities' }
];

const PERSONALITY_TRAITS = [
  { id: 'analytical', label: 'Analytical thinker' },
  { id: 'creative', label: 'Creative and artistic' },
  { id: 'detail-oriented', label: 'Detail-oriented' },
  { id: 'big-picture', label: 'Big-picture thinker' },
  { id: 'collaborative', label: 'Team player' },
  { id: 'independent', label: 'Independent worker' },
  { id: 'leadership', label: 'Natural leader' },
  { id: 'adaptable', label: 'Adaptable to change' },
  { id: 'perfectionist', label: 'Perfectionist' },
  { id: 'risk-taker', label: 'Willing to take risks' }
];

export default function InterestsStep({ data, onNext, onPrev, isFirst, isLast }: InterestsStepProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InterestsForm>({
    defaultValues: data.interests || {
      technicalInterests: [],
      industryInterests: [],
      workEnvironmentPreference: '',
      motivations: [],
      personalityTraits: [],
      hobbiesAndInterests: '',
      learningMotivation: '',
      workLifeBalance: '',
      additionalInfo: ''
    }
  });

  const watchedData = watch();

  const handleCheckboxChange = (field: keyof Pick<InterestsForm, 'technicalInterests' | 'industryInterests' | 'motivations' | 'personalityTraits'>, value: string, checked: boolean) => {
    const currentValues = watchedData[field] || [];
    let updatedValues;
    
    if (checked) {
      updatedValues = [...currentValues, value];
    } else {
      updatedValues = currentValues.filter((item: string) => item !== value);
    }
    
    setValue(field, updatedValues);
  };

  const onSubmit = (formData: InterestsForm) => {
    onNext({ interests: formData });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Technical Interests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <Label className="text-lg font-semibold text-foreground">Technical Interests</Label>
            </div>
            <p className="text-muted-foreground text-sm">Which technical areas excite you most? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TECHNICAL_INTERESTS.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={interest.id}
                    checked={watchedData.technicalInterests?.includes(interest.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('technicalInterests', interest.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={interest.id} className="text-foreground text-sm">{interest.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Interests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-400" />
              <Label className="text-lg font-semibold text-foreground">Industry Interests</Label>
            </div>
            <p className="text-muted-foreground text-sm">Which industries or sectors interest you? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {INDUSTRY_INTERESTS.map((industry) => (
                <div key={industry.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={industry.id}
                    checked={watchedData.industryInterests?.includes(industry.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('industryInterests', industry.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={industry.id} className="text-foreground text-sm">{industry.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Work Environment Preference */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-400" />
              <Label className="text-lg font-semibold text-foreground">Work Environment Preference</Label>
            </div>
            
            <Select onValueChange={(value) => setValue('workEnvironmentPreference', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="What work environment do you prefer?" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="startup">Startup (fast-paced, innovative)</SelectItem>
                <SelectItem value="tech-company">Tech Company (Google, Microsoft, etc.)</SelectItem>
                <SelectItem value="enterprise">Large Enterprise (stable, structured)</SelectItem>
                <SelectItem value="agency">Agency/Consultancy</SelectItem>
                <SelectItem value="freelance">Freelance/Contract Work</SelectItem>
                <SelectItem value="remote-first">Remote-first Companies</SelectItem>
                <SelectItem value="non-profit">Non-profit Organizations</SelectItem>
                <SelectItem value="government">Government/Public Sector</SelectItem>
                <SelectItem value="academic">Academic/Research Institutions</SelectItem>
                <SelectItem value="flexible">Flexible - depends on the role</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* What Motivates You */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              <Label className="text-lg font-semibold text-foreground">What Motivates You</Label>
            </div>
            <p className="text-muted-foreground text-sm">What drives and motivates you in your work? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOTIVATIONS.map((motivation) => (
                <div key={motivation.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={motivation.id}
                    checked={watchedData.motivations?.includes(motivation.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('motivations', motivation.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={motivation.id} className="text-foreground text-sm">{motivation.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Traits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <Label className="text-lg font-semibold text-foreground">Personality & Work Style</Label>
            </div>
            <p className="text-muted-foreground text-sm">How would you describe your personality and work style? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERSONALITY_TRAITS.map((trait) => (
                <div key={trait.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={trait.id}
                    checked={watchedData.personalityTraits?.includes(trait.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('personalityTraits', trait.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={trait.id} className="text-foreground text-sm">{trait.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Motivation */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">Learning Motivation</Label>
            
            <Select onValueChange={(value) => setValue('learningMotivation', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="What motivates you to learn?" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="career-advancement">Career advancement</SelectItem>
                <SelectItem value="curiosity">Pure curiosity and interest</SelectItem>
                <SelectItem value="problem-solving">Solving specific problems</SelectItem>
                <SelectItem value="staying-current">Staying current with technology</SelectItem>
                <SelectItem value="personal-growth">Personal growth and development</SelectItem>
                <SelectItem value="financial-goals">Financial goals</SelectItem>
                <SelectItem value="passion-projects">Working on passion projects</SelectItem>
                <SelectItem value="helping-others">Helping others and making an impact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work-Life Balance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <Label className="text-lg font-semibold text-foreground">Work-Life Balance Priority</Label>
            </div>
            
            <Select onValueChange={(value) => setValue('workLifeBalance', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="How important is work-life balance to you?" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="very-important">Very important - I prioritize balance</SelectItem>
                <SelectItem value="important">Important - I seek balance when possible</SelectItem>
                <SelectItem value="moderate">Moderate - Depends on the opportunity</SelectItem>
                <SelectItem value="flexible">Flexible - I'm willing to work hard for goals</SelectItem>
                <SelectItem value="career-focused">Career-focused - Willing to sacrifice for success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hobbies and Personal Interests */}
          <div className="space-y-2">
            <Label htmlFor="hobbiesAndInterests" className="text-foreground">Hobbies & Personal Interests</Label>
            <Textarea
              id="hobbiesAndInterests"
              {...register('hobbiesAndInterests')}
              placeholder="Tell us about your hobbies, interests outside of work, or anything else that makes you unique..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo" className="text-foreground">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              {...register('additionalInfo')}
              placeholder="Any other information about yourself, your goals, or preferences that you'd like to share..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Complete Profile Setup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
