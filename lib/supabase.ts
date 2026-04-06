import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getIdToken } from './auth';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Supabase client configured to use Firebase ID tokens for auth.
 *
 * On each request Supabase sends the current Firebase JWT in the
 * Authorization header. The Supabase project must have a custom JWT
 * verification function that validates Firebase tokens.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {},
      fetch: async (url, options = {}) => {
        const headers = new Headers(options.headers);
        try {
          const token = await getIdToken();
          headers.set('Authorization', `Bearer ${token}`);
        } catch {
          // Not signed in — send request without token
        }
        return fetch(url, { ...options, headers });
      },
    },
  },
);
