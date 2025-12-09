'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react'

interface LearningResource {
  id: string
  title: string
  type: 'article' | 'video' | 'course' | 'documentation'
  url?: string
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed: boolean
  description?: string
}

interface SkillArea {
  id: string
  name: string
  description: string
  completed: boolean
  progress: number
  resources: LearningResource[]
}

interface ProgressTrackerProps {
  skills: SkillArea[]
  onUpdateProgress: (skillId: string, resourceId?: string) => void
}

export function ProgressTracker({ skills, onUpdateProgress }: ProgressTrackerProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(skills[0]?.id || null)
  
  const overallProgress = skills.length > 0 
    ? Math.round(skills.reduce((acc, skill) => acc + skill.progress, 0) / skills.length)
    : 0
  
  const completedSkills = skills.filter(skill => skill.completed).length

  const getResourceIcon = (type: LearningResource['type']) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'course': return <BookOpen className="h-4 w-4" />
      case 'documentation': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: LearningResource['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20'
    }
  }

  const selectedSkillData = skills.find(skill => skill.id === selectedSkill)

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{completedSkills} of {skills.length} skills completed</span>
              <span>{skills.reduce((acc, skill) => acc + skill.resources.length, 0)} total resources</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg mb-4">Skill Areas</h3>
          {skills.map((skill) => (
            <Card 
              key={skill.id}
              className={`cursor-pointer transition-colors ${
                selectedSkill === skill.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedSkill(skill.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{skill.name}</h4>
                  {skill.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Progress value={skill.progress} className="h-1 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{skill.progress}% complete</span>
                  <span>{skill.resources.filter(r => r.completed).length}/{skill.resources.length} resources</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Skill Details */}
        <div className="lg:col-span-2">
          {selectedSkillData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedSkillData.name}
                  <Badge variant={selectedSkillData.completed ? 'default' : 'secondary'}>
                    {selectedSkillData.completed ? 'Completed' : 'In Progress'}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground">{selectedSkillData.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Progress</span>
                    <span className="text-lg font-semibold">{selectedSkillData.progress}%</span>
                  </div>
                  <Progress value={selectedSkillData.progress} className="h-2" />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Learning Resources</h4>
                    {selectedSkillData.resources.map((resource) => (
                      <div 
                        key={resource.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg"
                      >
                        <Checkbox
                          checked={resource.completed}
                          onCheckedChange={() => onUpdateProgress(selectedSkillData.id, resource.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(resource.type)}
                            <h5 className={`font-medium ${resource.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {resource.title}
                            </h5>
                            {resource.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={getDifficultyColor(resource.difficulty)}
                            >
                              {resource.difficulty}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {resource.estimatedTime}
                            </Badge>
                          </div>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!selectedSkillData.completed && selectedSkillData.progress === 100 && (
                    <Button 
                      onClick={() => onUpdateProgress(selectedSkillData.id)}
                      className="w-full"
                    >
                      Mark Skill as Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a skill to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}