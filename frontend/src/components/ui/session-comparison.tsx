'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Clock,
  Target,
  Award
} from 'lucide-react'

interface SessionData {
  sessionId: string
  domainName: string
  completedAt: string
  confidence: number
  overallScore: number
  level: string
  answersCount: number
  recommendations?: {
    skills: string[]
    resources: string[]
  }
}

interface SessionComparisonProps {
  sessions: SessionData[]
}

export function SessionComparison({ sessions }: SessionComparisonProps) {
  const [session1Id, setSession1Id] = useState<string>('')
  const [session2Id, setSession2Id] = useState<string>('')

  const session1 = sessions.find(s => s.sessionId === session1Id)
  const session2 = sessions.find(s => s.sessionId === session2Id)

  const getComparisonIcon = (value1: number, value2: number) => {
    if (value1 > value2) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value1 < value2) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canCompare = session1 && session2 && session1.sessionId !== session2.sessionId

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compare Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Session</label>
              <Select value={session1Id} onValueChange={setSession1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.sessionId} value={session.sessionId}>
                      {session.domainName} - {formatDate(session.completedAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Second Session</label>
              <Select value={session2Id} onValueChange={setSession2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions
                    .filter(s => s.sessionId !== session1Id)
                    .map((session) => (
                      <SelectItem key={session.sessionId} value={session.sessionId}>
                        {session.domainName} - {formatDate(session.completedAt)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canCompare && (
            <div className="text-center py-8 text-muted-foreground">
              Select two different sessions to compare
            </div>
          )}
        </CardContent>
      </Card>

      {canCompare && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{session1!.domainName}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(session1!.completedAt)}
                <Clock className="h-4 w-4 ml-2" />
                {formatTime(session1!.completedAt)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {session1!.overallScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(session1!.confidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Level:</span>
                  <Badge variant="secondary">{session1!.level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Questions:</span>
                  <span className="text-sm font-medium">{session1!.answersCount}</span>
                </div>
              </div>

              {session1!.recommendations && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recommended Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {session1!.recommendations.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{session2!.domainName}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(session2!.completedAt)}
                <Clock className="h-4 w-4 ml-2" />
                {formatTime(session2!.completedAt)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {session2!.overallScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(session2!.confidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Level:</span>
                  <Badge variant="secondary">{session2!.level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Questions:</span>
                  <span className="text-sm font-medium">{session2!.answersCount}</span>
                </div>
              </div>

              {session2!.recommendations && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recommended Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {session2!.recommendations.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {canCompare && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparison Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-medium">Overall Score</span>
                  {getComparisonIcon(session1!.overallScore, session2!.overallScore)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.abs(session1!.overallScore - session2!.overallScore).toFixed(1)} point difference
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-medium">Confidence</span>
                  {getComparisonIcon(session1!.confidence, session2!.confidence)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.abs(session1!.confidence - session2!.confidence * 100).toFixed(1)}% difference
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="font-medium">Questions</span>
                  {getComparisonIcon(session1!.answersCount, session2!.answersCount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.abs(session1!.answersCount - session2!.answersCount)} question difference
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Award className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Progress Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {session1!.overallScore > session2!.overallScore
                      ? `Great improvement! Your score increased by ${(session1!.overallScore - session2!.overallScore).toFixed(1)} points.`
                      : session1!.overallScore < session2!.overallScore
                      ? `Your score decreased by ${(session2!.overallScore - session1!.overallScore).toFixed(1)} points. Consider revisiting the fundamentals.`
                      : 'Your scores are similar. Consistency is key to mastering skills!'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}