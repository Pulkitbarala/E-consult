import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/apiClient';
import SentimentLineChart from '@/components/SentimentLineChart';
import { Skeleton } from '@/components/ui/skeleton';

interface SentimentDay {
  date: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const AnalysisDashboard = () => {
  const { id: consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalPositiveScore: 0,
    totalNegativeScore: 0,
    positiveCount: 0,
    negativeCount: 0,
    overallScore: 0,
    sentimentDays: [] as SentimentDay[],
  });
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [aiMode, setAiMode] = useState(false);
  const [aiFilter, setAiFilter] = useState<'positive only'|'negative only'|'all'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string>('');
  const [aiCounts, setAiCounts] = useState<{positive:number;negative:number;neutral:number}|null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{id:string; role:'assistant'|'user'; content:string; status?:'thinking'|'typing'}>>([]);
  const [ragSessionId, setRagSessionId] = useState<string | null>(null);
  const [keywordCloud, setKeywordCloud] = useState<Array<{ text: string; count: number }>>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [cloudImageUrl, setCloudImageUrl] = useState<string | null>(null);
  const [cloudImageLoading, setCloudImageLoading] = useState(false);
  const [cloudImageError, setCloudImageError] = useState<string | null>(null);
  const cloudContainerRef = useRef<HTMLDivElement | null>(null);
  const messageIdRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);
  const [cloudWidth, setCloudWidth] = useState(0);
  const MLAPI_URL = useMemo(() => (import.meta.env.VITE_MLAPI_URL as string | undefined) || ' https://backer-dodge-carton.ngrok-free.dev', []);//https://api-ecs-1.onrender.com
  const SUMMARIZER_URL = useMemo(() => (import.meta.env.VITE_SUMMARIZER_URL as string | undefined) || 'https://chatbot-e-consult.vercel.app', []);//http://localhost:8081
  const fallbackCloudWidth = useMemo(() => Math.min(720, Math.max(320, window.innerWidth - 48)), []);

  const ragComments = useMemo(() => {
    return comments.map(c => ({
      id: c.id,
      content: c.content,
      sentimenttype: c.sentimenttype || 'neutral',
    }));
  }, [comments]);

  const countsForFilter = useMemo(() => {
    const filtered = ragComments.filter(c => {
      if (aiFilter === 'positive only') return c.sentimenttype === 'positive';
      if (aiFilter === 'negative only') return c.sentimenttype === 'negative';
      return true;
    });
    return filtered.reduce((acc, c) => {
      const key = c.sentimenttype === 'positive' || c.sentimenttype === 'negative' ? c.sentimenttype : 'neutral';
      acc[key] += 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });
  }, [ragComments, aiFilter]);

  const cloudHeight = useMemo(() => {
    if (!cloudWidth) return 0;
    return Math.max(240, Math.min(480, Math.round(cloudWidth * 0.6)));
  }, [cloudWidth]);

  const effectiveCloudWidth = cloudWidth || fallbackCloudWidth;
  const effectiveCloudHeight = cloudHeight || Math.max(240, Math.min(480, Math.round(effectiveCloudWidth * 0.6)));

  const isAiBusy = aiLoading || aiTyping;
  const nextMessageId = () => String(++messageIdRef.current);

  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  const startTypingMessage = (id: string, fullText: string) => {
    clearTypingTimer();
    const text = typeof fullText === 'string' ? fullText : String(fullText || '');
    const tokens = text ? text.split(/(\s+)/) : [];
    if (!tokens.length) {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: text, status: undefined } : m)));
      setAiTyping(false);
      return;
    }

    setAiTyping(true);
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: '', status: 'typing' } : m)));
    const delay = Math.max(12, Math.min(45, Math.floor(9000 / tokens.length)));
    let index = 0;
    typingTimerRef.current = window.setInterval(() => {
      index += 1;
      const content = tokens.slice(0, index).join('');
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content } : m)));
      if (index >= tokens.length) {
        clearTypingTimer();
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: text, status: undefined } : m)));
        setAiTyping(false);
      }
    }, delay);
  };

  useEffect(() => {
    setAiCounts(countsForFilter);
  }, [countsForFilter]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, []);

  async function runRagChat(intent: 'qa'|'summary'|'short-notes'|'feedback', question?: string, label?: string) {
    if (isAiBusy) return;
    if (!SUMMARIZER_URL) {
      console.warn('VITE_SUMMARIZER_URL not set');
      return;
    }
    if (!consultationId) {
      setMessages(prev => [...prev, { id: nextMessageId(), role: 'assistant', content: 'Missing consultation id.' }]);
      return;
    }
    if (!ragComments.length) {
      setMessages(prev => [...prev, { id: nextMessageId(), role: 'assistant', content: 'No comments available yet.' }]);
      return;
    }

    const trimmedQuestion = question?.trim() || '';
    if (intent === 'qa' && !trimmedQuestion) {
      return;
    }

    const userText = label || trimmedQuestion;
    if (userText) {
      setMessages(prev => [...prev, { id: nextMessageId(), role: 'user', content: userText }]);
    }
    if (intent === 'qa') {
      setAiQuestion('');
    }
    const assistantId = nextMessageId();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', status: 'thinking' }]);
    setAiLoading(true);
    setAiSummaryText('');
    try {
      const payload = {
        consultationId,
        comments: ragComments,
        filter: aiFilter,
        question: trimmedQuestion || undefined,
        intent,
        sessionId: ragSessionId,
      };

      const sendWithRetry = async (attempt: number): Promise<Response> => {
        try {
          return await fetch(`${SUMMARIZER_URL}/rag/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err: any) {
          const message = String(err?.message || err || '');
          const isFetchFailed = /fetch failed|failed to fetch/i.test(message);
          if (isFetchFailed && attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
            return sendWithRetry(attempt + 1);
          }
          throw err;
        }
      };

      const res = await sendWithRetry(0);
      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
      const text = res.ok ? (data?.answer || '') : (data?.error || 'Failed to respond');
      setAiSummaryText(text);
      startTypingMessage(assistantId, text);
      if (res.ok && data.sessionId) {
        setRagSessionId(data.sessionId);
      }
    } catch (e: any) {
      const err = String(e?.message || e || 'Failed to respond');
      setAiSummaryText(err);
      startTypingMessage(assistantId, err);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (user) fetchData();
  }, [user, consultationId]);

  useEffect(() => {
    const el = cloudContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const fallbackWidth = Math.min(720, Math.max(320, window.innerWidth - 48));
      const nextWidth = el.clientWidth || fallbackWidth;
      setCloudWidth(nextWidth);
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [keywordCloud.length]);

  useEffect(() => {
    if (keywordCloud.length === 0) {
      setCloudImageUrl(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setCloudImageError(null);
      setCloudImageLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    const timer = window.setTimeout(async () => {
      setCloudImageLoading(true);
      setCloudImageError(null);
      try {
        const res = await fetch(`${MLAPI_URL}/wordcloud`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: keywordCloud,
            width: Math.round(effectiveCloudWidth),
            height: Math.round(effectiveCloudHeight),
            max_words: 80,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Word cloud failed with status ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('image')) {
          const msg = await res.text();
          throw new Error(msg || 'Word cloud response was not an image');
        }

        const blob = await res.blob();
        if (!blob.size) {
          throw new Error('Word cloud image was empty');
        }

        const nextUrl = URL.createObjectURL(blob);
        setCloudImageUrl(prev => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return nextUrl;
        });
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error('Word cloud image error:', err);
          setCloudImageError(String(err?.message || err || 'Failed to generate word cloud'));
          setCloudImageUrl(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCloudImageLoading(false);
        }
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.clearTimeout(timeoutId);
    };
  }, [MLAPI_URL, effectiveCloudHeight, effectiveCloudWidth, keywordCloud]);

  async function fetchKeywords(consultationId?: string) {
    if (!consultationId) {
      setKeywordCloud([]);
      return;
    }

    setKeywordLoading(true);
    setKeywordError(null);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('keyword')
        .eq('consultation_id', consultationId)
        .not('keyword', 'is', null);

      if (error) {
        throw error;
      }

      const counts = new Map<string, { text: string; count: number }>();
      (data || []).forEach(row => {
        const raw = String(row.keyword || '');
        if (!raw) return;
        raw
          .split(/[,;|]+/g)
          .map(token => token.trim())
          .filter(Boolean)
          .forEach(token => {
            const normalized = token.toLowerCase().replace(/\s+/g, ' ').trim();
            if (!normalized) return;
            const existing = counts.get(normalized);
            if (existing) {
              existing.count += 1;
            } else {
              counts.set(normalized, { text: token, count: 1 });
            }
          });
      });

      const items = Array.from(counts.values())
        .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
        .slice(0, 80);

      setKeywordCloud(items);
    } catch (e: any) {
      console.error('Error fetching keywords:', e);
      setKeywordError(String(e?.message || e || 'Failed to load keywords'));
      setKeywordCloud([]);
    } finally {
      setKeywordLoading(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [data] = await Promise.all([
        api.getAnalysisData(consultationId),
        fetchKeywords(consultationId),
      ]);
      setConsultations(data.consultations);
      setComments(data.comments);
      
      if (data.metrics) {
        const { totalPositiveScore, totalNegativeScore, positiveCount, negativeCount, overallScore, chartData } = data.metrics;
        
        // Transform chartData to sentimentDays format
        const sentimentDays: SentimentDay[] = chartData.map((day: any) => {
          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (day.positive > day.negative) sentiment = 'positive';
          else if (day.negative > day.positive) sentiment = 'negative';
          return {
            date: day.date,
            score: day.score,
            sentiment,
          };
        });
        
        setMetrics({
          totalPositiveScore,
          totalNegativeScore,
          positiveCount,
          negativeCount,
          overallScore,
          sentimentDays,
        });
      }
    } catch (error: any) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/my-consultations', { replace: true })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis Dashboard</h1>
      </div>
      {loading ? (
        <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={aiMode ? 'default' : 'outline'} size="sm" onClick={() => {
                const next = !aiMode; setAiMode(next);
              }}>
                {aiMode ? 'AI Mode: On' : 'Enter AI Mode'}
              </Button>
              {aiMode && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-300">Filter</label>
                  <select
                    className="text-xs px-2 py-1 border rounded bg-white dark:bg-slate-800"
                    value={aiFilter}
                    onChange={(e) => { setAiFilter(e.target.value as any); }}
                  >
                    <option value="all">All</option>
                    <option value="positive only">Positive only</option>
                    <option value="negative only">Negative only</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => runRagChat('summary', undefined, 'Summarize comments')}
                    disabled={isAiBusy}
                  >
                    Summarize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runRagChat('short-notes', undefined, 'Short notes')}
                    disabled={isAiBusy}
                  >
                    Short Notes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runRagChat('feedback', undefined, 'Feedback')}
                    disabled={isAiBusy}
                  >
                    Feedback
                  </Button>
                </div>
              )}
            </div>
            {aiMode && aiCounts && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Pos: {aiCounts.positive}</Badge>
                <Badge variant="secondary" className="text-xs">Neg: {aiCounts.negative}</Badge>
                <Badge variant="secondary" className="text-xs">Neu: {aiCounts.neutral}</Badge>
              </div>
            )}
          </div>

          {aiMode && (
            <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <CardTitle>AI Chat</CardTitle>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ask about sentiment trends, top themes, or specific feedback.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <style>{`
                  .chatbot-loader {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    height: 12px;
                  }

                  .chatbot-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 999px;
                    background: rgba(15, 23, 42, 0.55);
                    animation: chatbot-dot 1s infinite ease-in-out;
                  }

                  .chatbot-dot:nth-child(2) { animation-delay: 0.15s; }
                  .chatbot-dot:nth-child(3) { animation-delay: 0.3s; }

                  @keyframes chatbot-dot {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
                    40% { transform: translateY(-3px); opacity: 0.9; }
                  }
                `}</style>
                {/* Chat-like area */}
                <div className="space-y-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
                  {/* Chat log */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap ${
                            m.status === 'thinking' ? 'inline-flex items-center w-fit px-2.5 py-1 text-xs leading-none' : ''
                          } ${
                            m.role === 'user'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {m.status === 'thinking' ? (
                            <div className="chatbot-loader" aria-label="Thinking">
                              <span className="chatbot-dot" />
                              <span className="chatbot-dot" />
                              <span className="chatbot-dot" />
                            </div>
                          ) : (
                            <pre className="font-sans text-sm whitespace-pre-wrap">{m.content}</pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* User question input */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full min-w-0 px-3 py-2 border rounded text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="Ask a question…"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isAiBusy) runRagChat('qa', aiQuestion, aiQuestion);
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runRagChat('qa', aiQuestion, aiQuestion)}
                      disabled={isAiBusy || !aiQuestion.trim()}
                      className="w-full sm:w-auto"
                    >
                      Ask
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">Total Positive Score</Badge>
                  <div className="text-lg font-bold">{metrics.totalPositiveScore.toFixed(2)}</div>
                </div>
                <div>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">Total Negative Score</Badge>
                  <div className="text-lg font-bold">{metrics.totalNegativeScore.toFixed(2)}</div>
                </div>
                <div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">Positive Comments</Badge>
                  <div className="text-lg font-bold">{metrics.positiveCount}</div>
                </div>
                <div>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">Negative Comments</Badge>
                  <div className="text-lg font-bold">{metrics.negativeCount}</div>
                </div>
                <div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs">Overall Score</Badge>
                  <div className="text-lg font-bold">{metrics.overallScore.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Keyword Word Cloud</CardTitle>
            </CardHeader>
            <CardContent>
              {keywordLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : keywordError ? (
                <div className="text-sm text-red-600 dark:text-red-400">{keywordError}</div>
              ) : keywordCloud.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">No keywords yet.</div>
              ) : cloudImageError ? (
                <div className="text-sm text-red-600 dark:text-red-400">{cloudImageError}</div>
              ) : (
                <div ref={cloudContainerRef} className="w-full">
                  <div
                    className="relative w-full overflow-hidden rounded-md bg-white"
                    style={{ height: `${effectiveCloudHeight}px` }}
                  >
                    {cloudImageUrl ? (
                      <img
                        src={cloudImageUrl}
                        alt="Keyword word cloud"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-slate-500">
                        Generating word cloud…
                      </div>
                    )}
                    {cloudImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Sentiment Change Over Time</CardTitle>
              <div className="mt-2 flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-xs font-medium border ${viewMode === 'chart' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 border-slate-300'} transition`}
                  onClick={() => setViewMode('chart')}
                >
                  Line Chart
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs font-medium border ${viewMode === 'table' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700 border-slate-300'} transition`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'chart' ? (
                <div className="mb-6">
                  <SentimentLineChart data={metrics.sentimentDays} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Score</th>
                        <th className="text-left py-2 px-3">Sentiment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.sentimentDays.map(day => (
                        <tr key={day.date}>
                          <td className="py-2 px-3 font-mono">{day.date}</td>
                          <td className="py-2 px-3">{day.score.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <Badge variant="secondary" className={
                              day.sentiment === 'positive'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : day.sentiment === 'negative'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }>
                              {day.sentiment.charAt(0).toUpperCase() + day.sentiment.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
