import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl.trim() && supabaseAnonKey.trim()
);

export function shouldUseSupabaseData(): boolean {
  if (!isSupabaseConfigured) return false;
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('solaire_sim_logged_in') !== 'true';
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
