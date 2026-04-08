import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function analyzeCommentText(text: string) {
  try {
    const res = await fetch('http://127.0.0.1:8000/analyze_request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sentimenttype: data.sentimenttype ?? data.sentimentType ?? data.sentiment ?? null,
      score: typeof data.score === 'number' ? data.score : (typeof data.confidence === 'number' ? data.confidence : null),
      keyword: data.keyword ?? (Array.isArray(data.keywords) ? data.keywords.join(', ') : null),
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { comment_id } = await req.json();
  if (!comment_id) {
    return new Response('Missing comment_id', { status: 400 });
  }
  // Fetch comment
  const { data: comment, error } = await supabase
    .from('comments')
    .select('id, content')
    .eq('id', comment_id)
    .single();
  if (error || !comment) {
    return new Response('Comment not found', { status: 404 });
  }
  // Analyze
  const analysis = await analyzeCommentText(comment.content);
  if (!analysis) {
    return new Response('Analysis failed', { status: 500 });
  }
  // Update comment
  const { error: updateError } = await supabase
    .from('comments')
    .update({
      sentimenttype: analysis.sentimenttype,
      score: analysis.score,
      keyword: analysis.keyword,
    })
    .eq('id', comment_id);
  if (updateError) {
    return new Response('Update failed', { status: 500 });
  }
  return new Response(JSON.stringify({ success: true, ...analysis }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
