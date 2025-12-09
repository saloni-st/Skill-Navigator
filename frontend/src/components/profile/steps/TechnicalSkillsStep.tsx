"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Code, Database, Cloud, Smartphone } from 'lucide-react';

interface TechnicalSkillsStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface SkillEntry {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface TechnicalSkillsForm {
  programmingLanguages: SkillEntry[];
  frameworks: SkillEntry[];
  databases: SkillEntry[];
  cloudPlatforms: SkillEntry[];
  tools: SkillEntry[];
  otherSkills: string[];
}

const SKILL_CATEGORIES = {
  programmingLanguages: {
    title: 'Programming Languages',
    icon: Code,
    suggestions: ['JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin', 'Ruby']
  },
  frameworks: {
    title: 'Frameworks & Libraries',
    icon: Code,
    suggestions: ['React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET', 'Flutter', 'React Native']
  },
  databases: {
    title: 'Databases',
    icon: Database,
    suggestions: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra', 'DynamoDB', 'Firebase']
  },
  cloudPlatforms: {
    title: 'Cloud Platforms',
    icon: Cloud,
    suggestions: ['AWS', 'Azure', 'Google Cloud', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Firebase', 'Supabase']
  },
  tools: {
    title: 'Development Tools',
    icon: Smartphone,
    suggestions: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'VS Code', 'IntelliJ', 'Postman', 'Figma', 'Jira', 'Slack', 'Linux', 'Windows']
  }
};

export default function TechnicalSkillsStep({ data, onNext, onPrev, isFirst, isLast }: TechnicalSkillsStepProps) {
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Beginner');
  const [activeCategory, setActiveCategory] = useState<keyof typeof SKILL_CATEGORIES>('programmingLanguages');
  const [otherSkillInput, setOtherSkillInput] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm<TechnicalSkillsForm>({
    defaultValues: data.technicalSkills || {
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      cloudPlatforms: [],
      tools: [],
      otherSkills: []
    }
  });

  const watchedData = watch();

  // Helper function to get skill name from different formats
  const getSkillName = (skill: any): string => {
    if (typeof skill === 'string') return skill;
    return skill.name || skill.language || skill.framework || skill.tool || skill.database || skill.platform || '';
  };

  const addSkill = (category: keyof typeof SKILL_CATEGORIES, skillName: string, level: string) => {
    const currentSkills = watchedData[category] || [];
    const skillExists = currentSkills.some((skill: SkillEntry) => 
      getSkillName(skill).toLowerCase() === skillName.toLowerCase()
    );
    
    if (!skillExists && skillName.trim()) {
      const updatedSkills = [...currentSkills, { name: skillName, level: level as SkillEntry['level'] }];
      setValue(category, updatedSkills);
    }
    setNewSkill('');
  };

  const removeSkill = (category: keyof typeof SKILL_CATEGORIES, index: number) => {
    const currentSkills = watchedData[category] || [];
    const updatedSkills = currentSkills.filter((_: any, i: number) => i !== index);
    setValue(category, updatedSkills);
  };

  const addOtherSkill = () => {
    if (otherSkillInput.trim()) {
      const currentOtherSkills = watchedData.otherSkills || [];
      const updatedOtherSkills = [...currentOtherSkills, otherSkillInput.trim()];
      setValue('otherSkills', updatedOtherSkills);
      setOtherSkillInput('');
    }
  };

  const removeOtherSkill = (index: number) => {
    const currentOtherSkills = watchedData.otherSkills || [];
    const updatedOtherSkills = currentOtherSkills.filter((_, i) => i !== index);
    setValue('otherSkills', updatedOtherSkills);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Advanced': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Expert': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const onSubmit = (formData: TechnicalSkillsForm) => {
    console.log('TechnicalSkillsStep - Form submitted with data:', formData);
    
    // Enhanced data transformation for better LLM mapping
    const enhancedTechnicalData = {
      technicalSkills: {
        // Original structure
        programmingLanguages: formData.programmingLanguages || [],
        frameworks: formData.frameworks || [],
        databases: formData.databases || [],
        cloudPlatforms: formData.cloudPlatforms || [],
        tools: formData.tools || [],
        otherSkills: formData.otherSkills || [],
        
        // Enhanced mapping for LLM
        skillSummary: {
          totalSkills: getTotalSkillCount(formData),
          experienceLevel: inferOverallTechnicalLevel(formData),
          strongestAreas: getStrongestAreas(formData),
          developmentAreas: getDevelopmentAreas(formData),
          hasAdvancedSkills: hasAdvancedLevelSkills(formData),
          techStack: identifyTechStack(formData),
          skillsBreakdown: {
            languages: (formData.programmingLanguages || []).length,
            frameworks: (formData.frameworks || []).length, 
            databases: (formData.databases || []).length,
            cloud: (formData.cloudPlatforms || []).length,
            tools: (formData.tools || []).length,
            other: (formData.otherSkills || []).length
          }
        }
      }
    };
    
    console.log('Enhanced technical data being passed:', enhancedTechnicalData);
    onNext(enhancedTechnicalData);
  };
  
  const getTotalSkillCount = (formData: TechnicalSkillsForm): number => {
    return (formData.programmingLanguages?.length || 0) +
           (formData.frameworks?.length || 0) +
           (formData.databases?.length || 0) +
           (formData.cloudPlatforms?.length || 0) +
           (formData.tools?.length || 0) +
           (formData.otherSkills?.length || 0);
  };
  
  const inferOverallTechnicalLevel = (formData: TechnicalSkillsForm): string => {
    const allSkills = [
      ...(formData.programmingLanguages || []),
      ...(formData.frameworks || []),
      ...(formData.databases || []),
      ...(formData.cloudPlatforms || []),
      ...(formData.tools || [])
    ];
    
    if (allSkills.length === 0) return 'beginner';
    
    const expertCount = allSkills.filter(skill => skill && skill.level === 'Expert').length;
    const advancedCount = allSkills.filter(skill => skill && skill.level === 'Advanced').length;
    const intermediateCount = allSkills.filter(skill => skill && skill.level === 'Intermediate').length;
    
    if (expertCount > 0 || advancedCount >= 3) return 'advanced';
    if (advancedCount > 0 || intermediateCount >= 3) return 'intermediate';
    if (allSkills.length >= 3) return 'some_experience';
    return 'beginner';
  };
  
  const getStrongestAreas = (formData: TechnicalSkillsForm): string[] => {
    const areas: Array<{category: string, strength: number}> = [];
    
    Object.entries(formData).forEach(([category, skills]) => {
      if (Array.isArray(skills) && skills.length > 0) {
        const avgLevel = skills.reduce((sum, skill) => {
          if (!skill || !skill.level) return sum + 1;
          const levelMap: Record<string, number> = {'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4};
          const levelValue = levelMap[skill.level] || 1;
          return sum + levelValue;
        }, 0) / skills.length;
        
        areas.push({category, strength: avgLevel});
      }
    });
    
    return areas
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(area => area.category.replace(/([A-Z])/g, ' $1').trim());
  };
  
  const getDevelopmentAreas = (formData: TechnicalSkillsForm): string[] => {
    const commonAreas = ['Programming Languages', 'Frameworks', 'Databases', 'Cloud Platforms'];
    const userAreas = Object.keys(formData).filter(key => 
      Array.isArray(formData[key as keyof TechnicalSkillsForm]) && 
      (formData[key as keyof TechnicalSkillsForm] as any[]).length > 0
    );
    
    return commonAreas.filter(area => 
      !userAreas.some(userArea => 
        userArea.toLowerCase().includes(area.toLowerCase().replace(/\s+/g, ''))
      )
    );
  };
  
  const hasAdvancedLevelSkills = (formData: TechnicalSkillsForm): boolean => {
    const allSkills = [
      ...(formData.programmingLanguages || []),
      ...(formData.frameworks || []),
      ...(formData.databases || []),
      ...(formData.cloudPlatforms || []),
      ...(formData.tools || [])
    ];
    
    return allSkills.some(skill => skill && (skill.level === 'Advanced' || skill.level === 'Expert'));
  };
  
  const identifyTechStack = (formData: TechnicalSkillsForm): string => {
    const languages = (formData.programmingLanguages || [])
      .filter(skill => skill && skill.name)
      .map(skill => skill.name.toLowerCase());
    const frameworks = (formData.frameworks || [])
      .filter(skill => skill && skill.name)
      .map(skill => skill.name.toLowerCase());
    
    // Common tech stack patterns
    if (languages.includes('javascript') && frameworks.some(f => ['react', 'node.js', 'express.js'].includes(f))) {
      return 'MERN/MEAN Stack';
    }
    if (languages.includes('python') && frameworks.some(f => ['django', 'flask'].includes(f))) {
      return 'Python Web Development';
    }
    if (languages.includes('java') && frameworks.some(f => f.includes('spring'))) {
      return 'Java Enterprise';
    }
    if (languages.includes('c#') && frameworks.some(f => f.includes('asp.net'))) {
      return '.NET Development';
    }
    if (frameworks.some(f => ['flutter', 'react native'].includes(f))) {
      return 'Mobile Development';
    }
    
    return 'Full Stack Development';
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="profile-step-form">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={key}
                  type="button"
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key as keyof typeof SKILL_CATEGORIES)}
                  className={activeCategory === key 
                    ? "bg-primary text-primary-foreground" 
                    : "border-border text-muted-foreground hover:bg-muted"
                  }
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {category.title}
                </Button>
              );
            })}
          </div>

          {/* Active Category Section */}
          {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
            if (activeCategory !== key) return null;
            
            const categoryKey = key as keyof typeof SKILL_CATEGORIES;
            const skills = watchedData[categoryKey] || [];
            const IconComponent = category.icon;

            return (
              <div key={key} className="space-y-4">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold text-foreground">{category.title}</h4>
                </div>

                {/* Current Skills */}
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-muted/30 rounded-lg border border-border">
                  {skills.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No skills added yet. Add some skills below!</p>
                  ) : (
                    skills.map((skill: SkillEntry, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`${getLevelColor(skill.level)} flex items-center gap-2 px-3 py-1`}
                      >
                        {skill.name} - {skill.level}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-foreground"
                          onClick={() => removeSkill(categoryKey, index)}
                        />
                      </Badge>
                    ))
                  )}
                </div>

                {/* Add New Skill */}
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder={`Add ${category.title.toLowerCase()}`}
                    className="bg-background border-border text-foreground flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(categoryKey, newSkill, newSkillLevel);
                      }
                    }}
                  />
                  <Select value={newSkillLevel} onValueChange={(value: any) => setNewSkillLevel(value)}>
                    <SelectTrigger className="bg-background border-border text-foreground w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => addSkill(categoryKey, newSkill, newSkillLevel)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Suggestions:</Label>
                  <div className="flex flex-wrap gap-2">
                    {category.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSkill(categoryKey, suggestion, newSkillLevel)}
                        className="border-border text-muted-foreground hover:bg-muted text-xs"
                        disabled={skills.some((skill: SkillEntry) => 
                          getSkillName(skill).toLowerCase() === suggestion.toLowerCase()
                        )}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Other Skills Section */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h4 className="text-lg font-semibold text-foreground">Other Skills & Technologies</h4>
            
            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-muted/30 rounded-lg border border-border">
              {watchedData.otherSkills?.length === 0 || !watchedData.otherSkills ? (
                <p className="text-muted-foreground text-sm">Add any other relevant skills or technologies</p>
              ) : (
                watchedData.otherSkills.map((skill: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-primary/20 text-primary border-primary/30 flex items-center gap-2 px-3 py-1"
                  >
                    {skill}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-foreground"
                      onClick={() => removeOtherSkill(index)}
                    />
                  </Badge>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={otherSkillInput}
                onChange={(e) => setOtherSkillInput(e.target.value)}
                placeholder="Add other skills (e.g., Agile, Scrum, UI/UX Design, etc.)"
                className="bg-background border-border text-foreground flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOtherSkill();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addOtherSkill}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Continue to Learning Preferences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
