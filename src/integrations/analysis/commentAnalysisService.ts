// Service to analyze a comment using local HTTP API and update Supabase row
import { supabase } from '@/integrations/supabase/client';

export type CommentAnalysis = {
  sentimenttype?: string | null;
  score?: number | null;
  keyword?: string | null;
};

const PREDICT_URL = import.meta.env.VITE_PREDICT_URL || '/predict';

async function callLocalPredict(text: string): Promise<CommentAnalysis | null> {
  try {
    const res = await fetch(PREDICT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.warn('Predict API returned non-ok', res.status);
      return null;
    }
    const data = await res.json();
    // Expecting fields: sentimenttype, score, keyword (be tolerant to casing/aliases)
    const out: CommentAnalysis = {
      sentimenttype: data.sentimenttype ?? data.sentimentType ?? data.sentiment ?? null,
      score: typeof data.score === 'number' ? data.score : (typeof data.confidence === 'number' ? data.confidence : null),
      keyword: data.keyword ?? (Array.isArray(data.keywords) ? data.keywords.join(', ') : null),
    };
    return out;
  } catch (e) {
    console.warn('Predict API error', e);
    return null;
  }
}

export async function analyzeAndUpdateComment(commentId: string, content: string) {
  const analysis = await callLocalPredict(content);
  if (!analysis) return;
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        sentimenttype: analysis.sentimenttype ?? null,
        score: analysis.score ?? null,
        keyword: analysis.keyword ?? null,
      })
      .eq('id', commentId);
    if (error) {
      console.warn('Failed to update comment with analysis', error);
    }
  } catch (e) {
    console.warn('Unexpected error updating comment with analysis', e);
  }
}
