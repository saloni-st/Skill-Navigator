import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage or token
    const token = localStorage.getItem('skillnavigator_token');
    if (token) {
      try {
        // In a real app, you'd decode the JWT token or make an API call
        // For now, we'll use mock data
        const userData = {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user' // or 'admin' for admin users
        };
        setUser(userData);
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAdmin,
    isLoading,
    isAuthenticated: !!user
  };
}