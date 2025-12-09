"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { Brain, ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProfileGate from "@/components/profile/ProfileGate";
import { domainsAPI, sessionsAPI } from "@/lib/api";
import { Question, Domain, Session } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

// Loading states for assessment submission
const loadingStates = [
  { text: "Analyzing your responses..." },
  { text: "Processing skill assessment..." },
  { text: "Generating learning roadmap..." },
  { text: "Finalizing your results..." },
  { text: "Complete! Redirecting..." }
];

// Web Development Questions from Phase 0 Planning
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: "education_background",
    text: "What is your highest level of education completed?",
    type: "single-select",
    options: [
      { value: "high_school", label: "High School Diploma" },
      { value: "some_college", label: "Some College (no degree)" },
      { value: "associate", label: "Associate's Degree" },
      { value: "bachelors", label: "Bachelor's Degree" },
      { value: "masters", label: "Master's Degree" },
      { value: "phd", label: "PhD/Doctoral Degree" },
      { value: "bootcamp", label: "Coding Bootcamp" },
      { value: "self_taught", label: "Self-taught (no formal education)" }
    ],
    required: true,
    order: 1
  },
  {
    id: "programming_experience", 
    text: "How many years of programming experience do you have (in any language)?",
    type: "single-select",
    options: [
      { value: "beginner", label: "Complete beginner (0 years)" },
      { value: "less_than_1", label: "Less than 1 year" },
      { value: "1_to_2", label: "1-2 years" },
      { value: "3_to_5", label: "3-5 years" },
      { value: "6_to_10", label: "6-10 years" },
      { value: "more_than_10", label: "More than 10 years" }
    ],
    required: true,
    order: 2
  },
  {
    id: "time_commitment",
    text: "How many hours per week can you realistically dedicate to learning web development?",
    type: "single-select",
    options: [
      { value: "1_to_5", label: "1-5 hours per week" },
      { value: "6_to_10", label: "6-10 hours per week" },
      { value: "11_to_20", label: "11-20 hours per week" },
      { value: "21_to_40", label: "21-40 hours per week" },
      { value: "more_than_40", label: "More than 40 hours per week (full-time)" }
    ],
    required: true,
    order: 3
  },
  {
    id: "web_dev_focus",
    text: "Which area of web development interests you most?",
    type: "single-select",
    options: [
      { value: "frontend", label: "Frontend Development (user interfaces, visual design)" },
      { value: "backend", label: "Backend Development (servers, databases, APIs)" },
      { value: "fullstack", label: "Full-Stack Development (both frontend and backend)" },
      { value: "devops", label: "DevOps/Deployment (hosting, CI/CD, infrastructure)" },
      { value: "mobile_web", label: "Mobile Web Development (responsive design, PWAs)" }
    ],
    required: true,
    order: 4
  },
  {
    id: "learning_goal",
    text: "What is your main goal for learning web development?",
    type: "single-select",
    options: [
      { value: "first_job", label: "Get my first job as a web developer" },
      { value: "career_switch", label: "Switch careers from a different field" },
      { value: "personal_projects", label: "Build personal projects/side business" },
      { value: "advance_role", label: "Advance in my current tech role" },
      { value: "personal_interest", label: "Learn for personal interest/hobby" },
      { value: "freelance", label: "Freelance and work independently" }
    ],
    required: true,
    order: 5
  },
  {
    id: "technical_background",
    text: "Which statement best describes your current technical background?",
    type: "single-select", 
    options: [
      { value: "no_tech", label: "No technical background at all" },
      { value: "basic_computer", label: "Basic computer skills, no programming" },
      { value: "html_css", label: "Some HTML/CSS knowledge" },
      { value: "one_language", label: "Familiar with one programming language" },
      { value: "work_in_tech", label: "Work in tech but not web development" },
      { value: "experienced_programmer", label: "Experienced programmer, new to web development" }
    ],
    required: true,
    order: 6
  }
];

// Transform backend questions to frontend format
const transformBackendQuestions = (backendQuestions: any[]): Question[] => {
  return backendQuestions.map((q, index) => ({
    id: q.questionId || q.key || `question_${index}`,
    text: q.question || q.text || '',
    type: q.type === 'single_choice' ? 'single-select' : 
          q.type === 'multiple_choice' ? 'multi-select' : q.type,
    options: q.options?.map((opt: any) => ({
      value: opt.value,
      label: opt.label
    })) || [],
    required: q.required !== false,
    order: q.order || index + 1
  }));
};

function QuestionnaireContent() {
  const { domainId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🚀 QuestionnaireContent loaded - Debug mode active!');

  // Transform backend questions to frontend format
  const transformBackendQuestions = (backendQuestions: any[]): Question[] => {
    return backendQuestions.map((q, index) => ({
      id: q.key || `question_${index}`,
      text: q.question || q.text || '',
      type: q.type === 'single_choice' ? 'single-select' : 
            q.type === 'multiple_choice' ? 'multi-select' : 
            q.type as any,
      options: q.options?.map((opt: any) => ({
        value: opt.value,
        label: opt.label
      })) || [],
      required: q.required !== false,
      order: index + 1
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 Starting questionnaire fetch for domain:', domainId);
        console.log('🔑 Token check:', {
          token: !!localStorage.getItem('token'),
          skillnavigator_token: !!localStorage.getItem('skillnavigator_token'),
          tokenLength: localStorage.getItem('token')?.length || 0
        });
        
        // Try to fetch domain and questions from backend
        try {
          const domainResponse = await domainsAPI.getById(domainId as string);
          if (domainResponse?.success && domainResponse?.data?.domain) {
            setDomain(domainResponse.data.domain);
            if (domainResponse.data.domain.questions) {
              setQuestions(domainResponse.data.domain.questions.sort((a, b) => (a.order || 0) - (b.order || 0)));
            }
          }
        } catch (domainError) {
          console.warn('Could not fetch domain from backend, using fallback data');
        }

        // Try to fetch questions separately if not found in domain
        let questionsLoaded = false;
        if (questions.length === 0) {
          try {
            console.log('🔄 Fetching questions from backend for domain:', domainId);
            const questionsResponse = await domainsAPI.getQuestions(domainId as string);
            console.log('📥 Raw questions response:', questionsResponse);
            
            if (questionsResponse?.success && questionsResponse?.data?.questions) {
              console.log('🔍 Backend questions received:', questionsResponse.data.questions);
              console.log('🔍 First question structure:', JSON.stringify(questionsResponse.data.questions[0], null, 2));
              
              const transformedQuestions = transformBackendQuestions(questionsResponse.data.questions);
              console.log('✅ Transformed questions:', transformedQuestions);
              console.log('✅ First transformed question:', JSON.stringify(transformedQuestions[0], null, 2));
              
              setQuestions(transformedQuestions.sort((a, b) => (a.order || 0) - (b.order || 0)));
              console.log('✅ Questions set successfully, count:', transformedQuestions.length);
              questionsLoaded = true;
            } else {
              console.warn('❌ No questions in response or response not successful');
              console.log('📊 Full response:', JSON.stringify(questionsResponse, null, 2));
            }
          } catch (questionsError) {
            console.error('❌ Error fetching questions from backend:', questionsError);
            console.warn('🔄 Using fallback questions');
          }
        }

        // Use fallback questions if no questions loaded from backend
        if (!questionsLoaded && questions.length === 0) {
          console.warn('🚨 Using fallback questions - API failed!');
          setQuestions(FALLBACK_QUESTIONS);
          setDomain({
            id: domainId as string,
            name: 'Web Development',
            description: 'Learn modern web development skills',
            active: true,
            createdAt: new Date().toISOString()
          });
        }

        // Try to create a session
        let sessionCreated = false;
        try {
          console.log('🔄 Attempting to create session for domain:', domainId);
          console.log('🌐 API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
          console.log('👤 User:', user?.id);
          
          const sessionResponse = await sessionsAPI.create(domainId as string);
          console.log('📥 Session creation response:', sessionResponse);
          
          if (sessionResponse?.success && sessionResponse?.data) {
            // Handle the actual backend response format
            const sessionData = sessionResponse.data as any; // Use any to handle backend format
            
            // Convert backend response to frontend Session format
            const session: Session = {
              id: sessionData.sessionId || sessionData.id || sessionData.session?.id,
              domainId: sessionData.domainId || sessionData.session?.domainId || (domainId as string),
              userId: user?.id || 'anonymous',
              questionSetId: 'default',
              status: (sessionData.status === 'started' ? 'draft' : sessionData.status) || sessionData.session?.status || 'draft',
              answers: sessionData.answers || sessionData.session?.answers || {},
              createdAt: sessionData.createdAt || sessionData.session?.createdAt || new Date().toISOString(),
              updatedAt: sessionData.createdAt || sessionData.session?.updatedAt || new Date().toISOString()
            };
            
            setSession(session);
            console.log('✅ Session created successfully:', session.id);
            sessionCreated = true;
          } else {
            console.warn('❌ Session creation response not successful:', sessionResponse);
            console.warn('📊 Response data:', JSON.stringify(sessionResponse, null, 2));
          }
        } catch (sessionError) {
          console.error('❌ Session creation failed:', sessionError);
          console.error('📋 Error details:', {
            message: sessionError instanceof Error ? sessionError.message : String(sessionError),
            stack: sessionError instanceof Error ? sessionError.stack : 'No stack trace',
            name: sessionError instanceof Error ? sessionError.name : 'Unknown error'
          });
        }

        // Only proceed if we have a real backend session
        if (!sessionCreated) {
          setError('Failed to create assessment session. Please check your connection and try again.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error in questionnaire setup:', error);
        setError('Failed to load questionnaire. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (domainId) {
      fetchData();
    }
  }, [domainId]);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Auto-save progress locally
    if (session) {
      localStorage.setItem(`questionnaire_${session.id}`, JSON.stringify({
        ...answers,
        [questionId]: value
      }));
    }
  };

  const handleNext = async () => {
    console.log('=== HANDLE NEXT CALLED ===');
    console.log('Current question:', currentQuestion);
    console.log('Total questions:', questions.length);
    console.log('Is last question:', currentQuestion === questions.length - 1);
    
    const currentQ = questions[currentQuestion];
    const currentAnswer = answers[currentQ.id];
    
    console.log('Current question ID:', currentQ.id);
    console.log('Current answer:', currentAnswer);
    console.log('Question required:', currentQ.required);
    
    if (!currentAnswer && currentQ.required) {
      console.log('BLOCKED: Required question not answered');
      return; // Don't proceed if required question not answered
    }
    
    if (currentQuestion < questions.length - 1) {
      console.log('NEXT: Moving to next question');
      setCurrentQuestion(prev => prev + 1);
    } else {
      console.log('SUBMIT: Last question - submitting answers');
      // Show loader for results processing
      setShowLoader(true);
      // Last question - submit answers
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('=== SUBMISSION FUNCTION ENTERED ===');
    
    if (!session) {
      console.log('❌ BLOCKED: No session available');
      setError('Session not found. Please refresh the page and try again.');
      return;
    }
    
    if (submitting) {
      console.log('❌ BLOCKED: Already submitting');
      return;
    }
    
    console.log('=== SUBMISSION DEBUG ===');
    console.log('Session ID:', session.id);
    console.log('Session type:', session.id.startsWith('fallback-') ? 'FALLBACK' : 'BACKEND');
    console.log('Session object:', session);
    console.log('Answers:', answers);
    console.log('Answers keys:', Object.keys(answers));
    console.log('========================');
    
    try {
      setSubmitting(true);
      console.log('🔄 Setting submitting to true');
      
      // Try to submit to backend only if it's a real session
      if (!session.id.startsWith('fallback-')) {
        try {
          console.log('🌐 Attempting backend submission...');
          console.log('📤 Submitting to session:', session.id);
          console.log('📋 Submitting answers:', answers);
          
          const response = await sessionsAPI.submit(session.id, answers);
          console.log('📥 Backend response:', response);
          
          if (response?.success) {
            console.log('✅ Backend submission successful!');
            // Clear local storage
            localStorage.removeItem(`questionnaire_${session.id}`);
            
            // Wait for loader animation to complete (5 states × 1500ms = 7.5 seconds)
            // Add extra 1 second for smoother transition
            setTimeout(() => {
              console.log('🚀 Navigating to result page...');
              router.push(`/result/${session.id}`);
            }, 8500);
            return;
          } else {
            console.log('❌ Backend response not successful:', response);
            setError(`Submission failed: ${response?.message || 'Unknown error'}`);
            setShowLoader(false);
          }
        } catch (error) {
          console.error('❌ Backend submission failed:', error);
          setError('Failed to submit assessment. Please check your connection and try again.');
          setShowLoader(false);
        }
      } else {
        console.log('🎯 Fallback session detected, submission requires backend connection');
        setError('Assessment submission requires backend connection. Please try again.');
        setShowLoader(false);
      }
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR in handleSubmit:', error);
      setError('Failed to submit answers. Please try again.');
      setShowLoader(false);
    } finally {
      setSubmitting(false);
      // Don't turn off loader here - let it complete on success
    }
  };

  // Load saved answers from localStorage on component mount
  useEffect(() => {
    if (session) {
      const savedAnswers = localStorage.getItem(`questionnaire_${session.id}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (error) {
          console.error('Error loading saved answers:', error);
        }
      }
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No questions available for this domain.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const currentAnswer = answers[currentQ?.id];
  
  // Debug current state every render
  console.log('📊 Current state:', {
    currentQuestion,
    totalQuestions: questions.length,
    currentQ: currentQ,
    currentQOptions: currentQ?.options,
    optionsLength: currentQ?.options?.length,
    currentQId: currentQ?.id,
    currentAnswer,
    isLastQuestion,
    buttonDisabled: !currentAnswer,
    answersKeys: Object.keys(answers),
    answersObject: answers
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Multi Step Loader for assessment submission */}
      <Loader 
        loadingStates={loadingStates} 
        loading={showLoader} 
        duration={1500}
      />
      
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-foreground">
                SkillNavigator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-card/30 border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {domainId} Assessment
            </h2>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQ.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug Info */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                Debug: Q{currentQuestion + 1}, Type: {currentQ?.type}, Options: {currentQ?.options?.length || 0}, ID: {currentQ?.id}
              </div>
            )} */}
            
            <div className="space-y-3">
              {/* Text Type Questions */}
              {currentQ?.type === 'text' ? (
                <div className="space-y-3">
                  <textarea
                    id={currentQ.id}
                    name={currentQ.id}
                    value={currentAnswer || ''}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full min-h-[120px] p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share your experience and knowledge about this topic.
                  </p>
                </div>
              ) : currentQ?.options && currentQ.options.length > 0 ? (
                // Multiple Choice, Single Choice, Scale Questions
                currentQ.options.map((option) => (
                  <Label
                    key={option.value}
                    className={`
                      flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all
                      ${currentAnswer === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-border/80 hover:bg-card/50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={currentAnswer === option.value}
                      onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${currentAnswer === option.value 
                          ? 'border-primary' 
                        : 'border-muted-foreground'
                        }
                      `}
                    >
                      {currentAnswer === option.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-foreground">{option.label}</span>
                  </Label>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Question type not supported or missing options.</p>
                  <p className="text-xs mt-2">Question Type: {currentQ?.type}</p>
                  <p className="text-xs">Question ID: {currentQ?.id}</p>
                  <p className="text-xs">Options: {JSON.stringify(currentQ?.options)}</p>
                </div>
              )}
            </div>            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || showLoader}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={() => {
                  console.log('🔥 GET RESULTS BUTTON CLICKED!');
                  handleNext();
                }}
                disabled={!currentAnswer || showLoader}
                className={`min-w-[120px] transition-all duration-200 ${
                  showLoader ? 'bg-primary/70' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {showLoader ? (
                  <div className="flex items-center">
                    <Circle className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    {isLastQuestion ? "Get Results" : "Next"}
                    {!isLastQuestion && <ArrowRight className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <ProtectedRoute>
      <ProfileGate requiredForAssessment={true}>
        <QuestionnaireContent />
      </ProfileGate>
    </ProtectedRoute>
  );
}