import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes('unique constraint')) {
          throw new Error('An account with this email already exists');
        }
        throw error;
      }

      // Create verification token
      const token = crypto.randomUUID();
      const { error: tokenError } = await supabase.rpc('create_verification_token', {
        p_user_id: data.user?.id,
        p_token: token,
        p_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      if (tokenError) throw tokenError;

      // Send verification email
      const verifyUrl = `${window.location.origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: { email, verifyUrl }
      });

      if (emailError) throw emailError;
    } catch (error: any) {
      console.error('SignUp error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('SignIn error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('SignOut error:', error);
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const { error } = await supabase.rpc('verify_email', { p_token: token });
      if (error) throw error;
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.rpc('resend_verification', { p_email: email });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error resending verification:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      verifyEmail,
      resendVerification
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}