"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Briefcase, Calendar } from 'lucide-react';

interface ExperienceStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface WorkExperienceEntry {
  company: string;
  position: string;
  duration: string;
  description: string;
  technologies?: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  url?: string;
  duration?: string;
}

interface ExperienceForm {
  workExperience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  achievements?: string;
}

export default function ExperienceStep({ data, onNext, onPrev, isFirst, isLast }: ExperienceStepProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ExperienceForm>({
    defaultValues: data.experience || {
      workExperience: [{ company: '', position: '', duration: '', description: '', technologies: '' }],
      projects: [],
      achievements: ''
    }
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: 'workExperience'
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: 'projects'
  });

  const onSubmit = (formData: ExperienceForm) => {
    // Filter out empty entries
    formData.workExperience = formData.workExperience.filter(work => 
      work.company.trim() || work.position.trim() || work.description.trim()
    );
    
    formData.projects = formData.projects.filter(project => 
      project.name.trim() || project.description.trim()
    );

    onNext({ experience: formData });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Work Experience Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-green-400" />
              <h4 className="text-lg font-semibold text-foreground">Work Experience</h4>
            </div>
            
            <div className="space-y-4">
              {workFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Company/Organization</Label>
                      <Input
                        {...register(`workExperience.${index}.company`)}
                        placeholder="Company name"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Position/Role</Label>
                      <Input
                        {...register(`workExperience.${index}.position`)}
                        placeholder="Job title"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Duration
                      </Label>
                      <Input
                        {...register(`workExperience.${index}.duration`)}
                        placeholder="e.g., Jan 2020 - Present, 2 years"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-foreground">Job Description & Responsibilities</Label>
                      <Textarea
                        {...register(`workExperience.${index}.description`)}
                        placeholder="Describe your role, responsibilities, and key achievements..."
                        className="bg-background border-border text-foreground"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-foreground">Technologies/Tools Used</Label>
                      <Input
                        {...register(`workExperience.${index}.technologies`)}
                        placeholder="e.g., React, Node.js, Python, AWS, etc."
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-end md:col-span-2">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWork(index)}
                          className="border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Experience
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => appendWork({ company: '', position: '', duration: '', description: '', technologies: '' })}
                className="border-green-500 text-green-400 hover:bg-green-500/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h4 className="text-lg font-semibold text-foreground">Personal Projects</h4>
            </div>
            
            <div className="space-y-4">
              {projectFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Project Name</Label>
                      <Input
                        {...register(`projects.${index}.name`)}
                        placeholder="Project title"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Duration/Timeline</Label>
                      <Input
                        {...register(`projects.${index}.duration`)}
                        placeholder="e.g., 3 months, 2023"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-foreground">Project Description</Label>
                      <Textarea
                        {...register(`projects.${index}.description`)}
                        placeholder="Describe what the project does, your role, and key features..."
                        className="bg-background border-border text-foreground"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Technologies Used</Label>
                      <Input
                        {...register(`projects.${index}.technologies`)}
                        placeholder="e.g., React, Python, MongoDB"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Project URL (Optional)</Label>
                      <Input
                        {...register(`projects.${index}.url`)}
                        placeholder="https://github.com/... or demo link"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-end md:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProject(index)}
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Project
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => appendProject({ name: '', description: '', technologies: '', url: '', duration: '' })}
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-2">
            <Label className="text-foreground">Notable Achievements (Optional)</Label>
            <Textarea
              {...register('achievements')}
              placeholder="Awards, recognitions, publications, competitions won, or other notable achievements..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Technical Skills
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
