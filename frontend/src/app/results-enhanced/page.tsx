'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressTracker } from '@/components/ui/progress-tracker'
import { SessionComparison } from '@/components/ui/session-comparison'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'
import { 
  Brain,
  TrendingUp,
  Target,
  BookOpen,
  ArrowLeft,
  Award,
  Clock,
  User,
  BarChart3,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function EnhancedResultsPage() {
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain') || 'Web Development'
  const score = searchParams.get('score') || '75'
  const level = searchParams.get('level') || 'Intermediate'
  
  const [skills, setSkills] = useState<any[]>([])
  const [sessions] = useState<any[]>([])

  const handleUpdateProgress = (skillId: string, resourceId?: string) => {
    setSkills((prev: any[]) => prev.map((skill: any) => {
      if (skill.id === skillId) {
        if (resourceId) {
          // Update specific resource
          const updatedResources = skill.resources.map((resource: any) =>
            resource.id === resourceId 
              ? { ...resource, completed: !resource.completed }
              : resource
          )
          const completedCount = updatedResources.filter((r: any) => r.completed).length
          const progress = Math.round((completedCount / updatedResources.length) * 100)
          
          toast.success(
            updatedResources.find((r: any) => r.id === resourceId)?.completed 
              ? 'Resource marked as complete!' 
              : 'Resource marked as incomplete'
          )
          
          return {
            ...skill,
            resources: updatedResources,
            progress,
            completed: progress === 100
          }
        } else {
          // Mark entire skill as complete
          toast.success('Skill area completed! 🎉')
          return { ...skill, completed: true, progress: 100 }
        }
      }
      return skill
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Learning Results</h1>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Assessment Complete! 🎉</CardTitle>
                <p className="text-muted-foreground">
                  Here's your personalized learning path for <strong>{domain}</strong>
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{score}%</div>
                <Badge variant="secondary" className="text-sm">{level} Level</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-semibold">Score</div>
                  <div className="text-sm text-muted-foreground">{score}% overall</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-semibold">Level</div>
                  <div className="text-sm text-muted-foreground">{level}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-semibold">Resources</div>
                  <div className="text-sm text-muted-foreground">
                    {skills.reduce((acc: number, skill: any) => acc + skill.resources.length, 0)} items
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="font-semibold">Est. Time</div>
                  <div className="text-sm text-muted-foreground">~12 hours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Progress Tracker
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Compare Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <ProgressTracker 
              skills={skills} 
              onUpdateProgress={handleUpdateProgress}
            />
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <SessionComparison sessions={sessions} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/questionnaire/${domain.toLowerCase().replace(' ', '-')}`}>
            <Button size="lg">
              <TrendingUp className="h-4 w-4 mr-2" />
              Take Another Assessment
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}