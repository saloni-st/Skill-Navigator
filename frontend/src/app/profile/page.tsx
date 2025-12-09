"use client";

import React from 'react';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProfileDashboard from "@/components/profile/ProfileDashboard";
import UserNavigation from "@/components/navigation/UserNavigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function ProfileContent() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    console.log('Back to Dashboard clicked');
    try {
      router.push('/dashboard');
      console.log('Navigation initiated to /dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/onboarding');
  };

  const handleRefreshData = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <UserNavigation />
      
      <div className="bg-card/50 border-b border-border py-4 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground relative z-50"
              onClick={handleBackToDashboard}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Profile Management</h1>
            <div></div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileDashboard />
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}