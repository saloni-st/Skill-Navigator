"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { resultsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedResult } from "@/types/api";
import { EnhancedResultView } from "@/components/result/EnhancedResultView";
import { ProcessingView } from "@/components/result/ProcessingView";

export default function EnhancedResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const sessionId = params?.sessionId as string;
  
  const [result, setResult] = useState<EnhancedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [processing, setProcessing] = useState<any>(null);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await resultsAPI.getCompleteResult(sessionId);
      
      if (response.data) {
        console.log('Backend response:', response.data); // Debug log
        setResult(response.data as any); // Temporary type casting
        setProcessing(null); // Simplified for now
      }
    } catch (err: any) {
      console.error('Error fetching result:', err);
      setError(err.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLlm = async () => {
    try {
      setIsRetrying(true);
      
      const response = await resultsAPI.retryLlmRefinement(sessionId);
      
      if (response.success) {
        // Refresh the result to get updated data
        await fetchResult();
      }
    } catch (err: any) {
      console.error('Error retrying LLM refinement:', err);
      setError(err.message || 'Failed to retry LLM refinement');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancelProcessing = () => {
    // Navigate away or show confirmation
    router.push('/dashboard');
  };

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  // Show loading state initially
  if (loading && !result) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Show processing state
  if (processing) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProcessingView 
              processing={processing}
              onCancel={handleCancelProcessing}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Result</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchResult}>
                Try Again
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Show result
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Assessment Results
              </h1>
              <p className="text-muted-foreground">
                {result?.session?.domain?.name} • Session ID: {sessionId}
              </p>
            </div>

            {/* Enhanced Result View */}
            {result && (
              <EnhancedResultView
                result={result}
                onRetryLlm={handleRetryLlm}
                isRetrying={isRetrying}
                isAdmin={isAdmin}
              />
            )}
          </main>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}