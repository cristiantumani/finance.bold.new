import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCategories, setHasCategories] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      // Skip onboarding check if already on onboarding page
      if (location.pathname === '/onboarding') {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;

        const needsOnboarding = !data || data.length === 0;
        setHasCategories(!needsOnboarding);
        
        if (needsOnboarding) {
          console.log('User needs onboarding - no categories found');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log('Checking onboarding status for user:', user.id);
      checkOnboarding();
    } else {
      setLoading(false);
    }
  }, [user, location.pathname]);

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If we have determined there are no categories and we're not already on the onboarding page
  if (hasCategories === false && location.pathname !== '/onboarding') {
    console.log('Redirecting to onboarding - no categories found');
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}