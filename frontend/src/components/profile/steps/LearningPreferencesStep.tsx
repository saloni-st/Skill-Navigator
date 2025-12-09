"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Clock, Target, Users } from 'lucide-react';

interface LearningPreferencesStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface LearningPreferencesForm {
  learningStyle: string[];
  preferredFormats: string[];
  timeCommitment: string;
  difficultyPreference: string;
  pacePreference: string;
  feedbackStyle: string;
  practicalVsTheory: string;
  collaborationPreference: string;
  additionalPreferences?: string;
}

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual (diagrams, charts, videos)' },
  { id: 'auditory', label: 'Auditory (lectures, discussions)' },
  { id: 'kinesthetic', label: 'Hands-on (practical exercises, labs)' },
  { id: 'reading', label: 'Reading/Writing (articles, documentation)' }
];

const PREFERRED_FORMATS = [
  { id: 'videos', label: 'Video tutorials' },
  { id: 'articles', label: 'Written articles/blogs' },
  { id: 'interactive', label: 'Interactive courses' },
  { id: 'projects', label: 'Project-based learning' },
  { id: 'quizzes', label: 'Quizzes and assessments' },
  { id: 'liveSessions', label: 'Live sessions/webinars' },
  { id: 'books', label: 'Books and documentation' },
  { id: 'podcasts', label: 'Podcasts' }
];

export default function LearningPreferencesStep({ data, onNext, onPrev, isFirst, isLast }: LearningPreferencesStepProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LearningPreferencesForm>({
    defaultValues: {
      difficultyPreference: data.learningPreferences?.difficultyPreference || 'medium',
      learningStyle: [],
      preferredFormats: [],
      timeCommitment: '',
      pacePreference: '',
      feedbackStyle: '',
      practicalVsTheory: '',
      collaborationPreference: '',
      additionalPreferences: ''
    }
  });

  const watchedData = watch();

  const handleCheckboxChange = (field: 'learningStyle' | 'preferredFormats', value: string, checked: boolean) => {
    const currentValues = watchedData[field] || [];
    let updatedValues;
    
    if (checked) {
      updatedValues = [...currentValues, value];
    } else {
      updatedValues = currentValues.filter((item: string) => item !== value);
    }
    
    setValue(field, updatedValues);
  };

  const onSubmit = (formData: LearningPreferencesForm) => {
    // Require difficultyPreference
    if (!formData.difficultyPreference) {
      alert('Please select a difficulty preference.');
      return;
    }
    onNext({ learningPreferences: formData });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Learning Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <Label className="text-lg font-semibold text-foreground">Learning Style Preferences</Label>
            </div>
            <p className="text-muted-foreground text-sm">How do you learn best? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEARNING_STYLES.map((style) => (
                <div key={style.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={style.id}
                    checked={watchedData.learningStyle?.includes(style.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('learningStyle', style.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={style.id} className="text-foreground text-sm">{style.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Content Formats */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">Preferred Content Formats</Label>
            <p className="text-muted-foreground text-sm">What types of learning materials do you prefer? (Select all that apply)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREFERRED_FORMATS.map((format) => (
                <div key={format.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={format.id}
                    checked={watchedData.preferredFormats?.includes(format.id) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('preferredFormats', format.id, checked as boolean)
                    }
                    className="border-border data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={format.id} className="text-foreground text-sm">{format.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Commitment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              <Label className="text-lg font-semibold text-foreground">Time Commitment</Label>
            </div>
            <p className="text-muted-foreground text-sm">How much time can you dedicate to learning per week?</p>
            
            <Select onValueChange={(value) => setValue('timeCommitment', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select time commitment" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="1-3">1-3 hours per week</SelectItem>
                <SelectItem value="3-5">3-5 hours per week</SelectItem>
                <SelectItem value="5-10">5-10 hours per week</SelectItem>
                <SelectItem value="10-15">10-15 hours per week</SelectItem>
                <SelectItem value="15+">15+ hours per week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Learning Pace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Learning Pace</Label>
              <p className="text-muted-foreground text-sm">What pace works best for you?</p>
              
              <Select onValueChange={(value) => setValue('pacePreference', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select pace preference" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="slow">Slow and steady</SelectItem>
                  <SelectItem value="moderate">Moderate pace</SelectItem>
                  <SelectItem value="fast">Fast-paced</SelectItem>
                  <SelectItem value="intensive">Intensive/Bootcamp style</SelectItem>
                  <SelectItem value="flexible">Flexible, varies by topic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground flex items-center gap-1">
                Difficulty Preference <span className="text-red-400">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">What level of difficulty do you prefer?</p>
              <Select value={watchedData.difficultyPreference || ''} onValueChange={(value) => setValue('difficultyPreference', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select difficulty preference" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="gradual">Gradual progression</SelectItem>
                  <SelectItem value="challenging">Jump into challenging content</SelectItem>
                  <SelectItem value="mixed">Mix of easy and hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Practical vs Theory */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              <Label className="text-lg font-semibold text-foreground">Learning Approach</Label>
            </div>
            <p className="text-muted-foreground text-sm">Do you prefer practical or theoretical learning?</p>
            
            <Select onValueChange={(value) => setValue('practicalVsTheory', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select learning approach" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="practical">Highly practical (80% hands-on)</SelectItem>
                <SelectItem value="mostly-practical">Mostly practical (60% hands-on)</SelectItem>
                <SelectItem value="balanced">Balanced (50-50)</SelectItem>
                <SelectItem value="mostly-theory">Mostly theoretical (60% theory)</SelectItem>
                <SelectItem value="theory">Highly theoretical (80% theory)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">Feedback Style</Label>
              <p className="text-muted-foreground text-sm">How do you prefer to receive feedback?</p>
              
              <Select onValueChange={(value) => setValue('feedbackStyle', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select feedback style" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="immediate">Immediate feedback</SelectItem>
                  <SelectItem value="detailed">Detailed explanations</SelectItem>
                  <SelectItem value="hints">Hints and guidance</SelectItem>
                  <SelectItem value="minimal">Minimal, let me figure it out</SelectItem>
                  <SelectItem value="peer">Peer review and discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <Label className="text-lg font-semibold text-foreground">Collaboration</Label>
              </div>
              <p className="text-muted-foreground text-sm">Do you prefer learning alone or with others?</p>
              
              <Select onValueChange={(value) => setValue('collaborationPreference', value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select collaboration preference" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="solo">Prefer learning alone</SelectItem>
                  <SelectItem value="small-group">Small group discussions</SelectItem>
                  <SelectItem value="large-group">Large group activities</SelectItem>
                  <SelectItem value="peer-pair">Pair programming/peer learning</SelectItem>
                  <SelectItem value="flexible">Flexible, depends on topic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="space-y-2">
            <Label className="text-foreground">Additional Learning Preferences (Optional)</Label>
            <Textarea
              {...register('additionalPreferences')}
              placeholder="Any other learning preferences, accessibility needs, or specific requirements..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Career Goals
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
