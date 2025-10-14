import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = "https://kylrkuwujlvankuwqqdc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bHJrdXd1amx2YW5rdXdxcWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NzE2OTYsImV4cCI6MjA3NDM0NzY5Nn0.lN63THeTMWFGhVm4wrba7lQX1jjAeU20C2vs2jy_gEI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Feature flag to toggle backend RPC for feed (set VITE_USE_RPC_FEED=true to enable)

const USE_RPC_FEED = import.meta.env.VITE_USE_RPC_FEED === 'true';

/**
 * Fetch feed consultations. If USE_RPC_FEED is enabled, call the RPC that excludes
 * consultations the user already commented on. Otherwise return null so caller can fall back
 * to client-side logic.
*/

export async function getFeedConsultationsRpc(userId: string | null, page = 1, pageSize = 20) {
  if (!USE_RPC_FEED || !userId) return null;
  const { data, error } = await (supabase as any).rpc('get_feed_consultations', { p_user_id: userId, p_page: page, p_page_size: pageSize });
  return { data, error };
}
