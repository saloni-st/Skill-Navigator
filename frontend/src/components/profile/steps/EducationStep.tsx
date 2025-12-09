"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GraduationCap, Award } from 'lucide-react';

interface EducationStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface EducationEntry {
  degree: string;
  institution: string;
  field: string;
  year: string;
  gpa?: string;
}

interface CertificationEntry {
  name: string;
  issuer: string;
  year: string;
  url?: string;
}

interface EducationForm {
  education: EducationEntry[];
  certifications: CertificationEntry[];
  additionalInfo?: string;
}

export default function EducationStep({ data, onNext, onPrev, isFirst, isLast }: EducationStepProps) {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<EducationForm>({
    defaultValues: data.education || {
      education: [{ degree: '', institution: '', field: '', year: '', gpa: '' }],
      certifications: [],
      additionalInfo: ''
    }
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control,
    name: 'certifications'
  });

  const onSubmit = (formData: EducationForm) => {
    // Filter out empty education entries
    formData.education = formData.education.filter(edu => 
      edu.degree.trim() || edu.institution.trim() || edu.field.trim()
    );
    
    // Filter out empty certification entries
    formData.certifications = formData.certifications.filter(cert => 
      cert.name.trim() || cert.issuer.trim()
    );

    onNext({ education: formData });
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Education Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Education</h4>
            </div>
            
            <div className="space-y-4">
              {educationFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Degree/Level *</Label>
                      <Select 
                        value={watch(`education.${index}.degree`)}
                        onValueChange={(value) => {
                          setValue(`education.${index}.degree`, value);
                        }}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="High School">High School</SelectItem>
                          <SelectItem value="Associate">Associate Degree</SelectItem>
                          <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="Master">Master's Degree</SelectItem>
                          <SelectItem value="PhD">PhD/Doctorate</SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Certificate">Certificate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Institution *</Label>
                      <Input
                        {...register(`education.${index}.institution`)}
                        placeholder="University/School name"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Field of Study</Label>
                      <Input
                        {...register(`education.${index}.field`)}
                        placeholder="e.g., Computer Science, Business"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Year of Completion</Label>
                      <Input
                        {...register(`education.${index}.year`)}
                        placeholder="e.g., 2023 or Expected 2024"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">GPA/Grade (Optional)</Label>
                      <Input
                        {...register(`education.${index}.gpa`)}
                        placeholder="e.g., 3.8/4.0 or A"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-end">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEducation(index)}
                          className="border-red-500 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => appendEducation({ degree: '', institution: '', field: '', year: '', gpa: '' })}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Education
              </Button>
            </div>
          </div>

          {/* Certifications Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Certifications & Courses</h4>
            </div>
            
            <div className="space-y-4">
              {certificationFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Certification/Course Name</Label>
                      <Input
                        {...register(`certifications.${index}.name`)}
                        placeholder="e.g., AWS Solutions Architect"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Issuing Organization</Label>
                      <Input
                        {...register(`certifications.${index}.issuer`)}
                        placeholder="e.g., Amazon Web Services"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Year Obtained</Label>
                      <Input
                        {...register(`certifications.${index}.year`)}
                        placeholder="e.g., 2023"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Certificate URL (Optional)</Label>
                      <Input
                        {...register(`certifications.${index}.url`)}
                        placeholder="https://..."
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-end md:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCertification(index)}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => appendCertification({ name: '', issuer: '', year: '', url: '' })}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification/Course
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <Label className="text-foreground">Additional Education Information (Optional)</Label>
            <Textarea
              {...register('additionalInfo')}
              placeholder="Any other relevant educational background, self-taught skills, or learning experiences..."
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Experience
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}