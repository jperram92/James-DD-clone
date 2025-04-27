import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using mock values for development.');
}

// Create Supabase client with error handling
let supabaseClient;

try {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client for development
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Mock auth') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Mock auth') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: () => {} }) }),
      subscribe: (callback: any) => { callback('SUBSCRIBED'); return {}; },
    }),
    removeChannel: () => {},
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as any;
}

export const supabase = supabaseClient;
