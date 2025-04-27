import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'DM' | 'player') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'DM' | 'player') => {
    try {
      // First, sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          // This ensures the user is automatically signed in after registration
          emailRedirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;

      // Check if the user was created successfully
      if (!data.user) {
        throw new Error('User registration failed');
      }

      console.log('User registered successfully:', data.user);

      // Note: In Supabase, there's often a trigger that creates the user profile
      // automatically when a new user signs up. If that's not set up, we need to
      // create the profile manually.

      try {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            role,
            last_login: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // This is critical - we need to throw the error to prevent proceeding
          throw profileError;
        } else {
          console.log('User profile created successfully');
        }

        // In development mode, automatically sign in the user
        if (import.meta.env.DEV) {
          // Sign in the user directly after registration
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.warn('Auto sign-in after registration failed:', signInError);
          } else {
            console.log('User automatically signed in after registration');
          }
        }
      } catch (profileError: any) {
        console.error('Error creating user profile:', profileError);

        // If this is a permission error, we need to delete the auth user
        // since the profile creation failed
        if (profileError.code === '42501' || profileError.code === '42503') {
          try {
            // In a real app, you'd use admin functions to delete the user
            // For now, we'll just sign out
            await supabase.auth.signOut();
            console.log('Signed out user due to permission error creating profile');
          } catch (signOutError) {
            console.error('Error signing out after profile creation failure:', signOutError);
          }
        }

        // Rethrow the error to be handled by the caller
        throw profileError;
      }

      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
