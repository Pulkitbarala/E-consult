import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!; // Use service role for server-side

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('page_size') || '20', 10);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_feed_consultations', { p_user_id: userId, p_page: page, p_page_size: pageSize });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
});
