import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!; // service role key for server-side

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

function toCSV(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h] == null ? '' : String(r[h]);
      const escaped = v.replace(/"/g, '""');
      return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

serve(async (req) => {
  try {
    // CORS: respond to preflight requests and include CORS headers on responses.
    const origin = req.headers.get('origin') || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(req.url);
    // Accept consultation_id from query or JSON body
    let consultationId = url.searchParams.get('consultation_id');

    let bodyConsultationId: string | null = null;
    if (!consultationId && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const jb = await req.json();
        bodyConsultationId = jb?.consultation_id || null;
      } catch (e) {
        // ignore
      }
    }

    consultationId = consultationId || bodyConsultationId;

    if (!consultationId) {
      return new Response(JSON.stringify({ error: 'consultation_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('authorization') || '';
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'Authorization Bearer token required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = tokenMatch[1];

    // Verify token and get user id
    const clientWithToken = createClient(SUPABASE_URL, token, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await clientWithToken.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    // Fetch consultation using service key and ensure ownership
    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .select('id, user_id')
      .eq('id', consultationId)
      .single();

    if (consultErr || !consultation) {
      return new Response(JSON.stringify({ error: 'Consultation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (consultation.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: comments, error: commentsErr } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });

    if (commentsErr) {
      return new Response(JSON.stringify({ error: commentsErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      if (!pErr && p) profiles = p;
    }

    const profileMap = profiles.reduce((acc: Record<string, any>, p: any) => { acc[p.user_id] = p; return acc; }, {} as Record<string, any>);

    const rows = (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      author_display_name: profileMap[c.user_id]?.display_name || '',
    }));

    const csv = toCSV(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="consultation-${consultationId}-comments.csv"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { ...{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    }, 'Content-Type': 'application/json' } });
  }
});
