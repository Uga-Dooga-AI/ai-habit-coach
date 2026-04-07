import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getIdToken } from './auth';

// Use placeholder values when env vars are not configured (CI / deferred-provider builds).
// The client will be created but all requests will fail gracefully — real credentials
// are required for any actual Supabase operation.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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
