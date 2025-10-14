import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SentimentLineChart from '@/components/SentimentLineChart';

interface SentimentDay {
  date: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const AnalysisDashboard = () => {
  const { id: consultationId } = useParams();
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    // Fetch consultations created by user
    let consults;
    if (consultationId) {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, title, created_at')
        .eq('id', consultationId);
      if (error || !data) {
        setLoading(false);
        return;
      }
      consults = data;
    } else {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, title, created_at')
        .eq('user_id', user.id);
      if (error || !data) {
        setLoading(false);
        return;
      }
      consults = data;
    }
    setConsultations(consults);
    // Fetch all comments for these consultations
    const consultIds = consults.map(c => c.id);
    const { data: allComments, error: commentError } = await supabase
      .from('comments')
      .select('id, consultation_id, content, created_at, sentimenttype, score')
      .in('consultation_id', consultIds);
    if (commentError || !allComments) {
      setLoading(false);
      return;
    }
    setComments(allComments);
    // Calculate metrics
    const posComments = allComments.filter(c => c.sentimenttype === 'positive');
    const negComments = allComments.filter(c => c.sentimenttype === 'negative');
    const totalPositiveScore = posComments.reduce((sum, c) => sum + (c.score || 0), 0);
    const totalNegativeScore = negComments.reduce((sum, c) => sum + (c.score || 0), 0);
    const positiveCount = posComments.length;
    const negativeCount = negComments.length;
    const overallScore = allComments.reduce((sum, c) => sum + (c.score || 0), 0) / (allComments.length || 1);
    // Daywise sentiment change
    const dayMap: Record<string, { score: number; pos: number; neg: number; }> = {};
    allComments.forEach(c => {
      const day = c.created_at.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { score: 0, pos: 0, neg: 0 };
      dayMap[day].score += c.score || 0;
      if (c.sentimenttype === 'positive') dayMap[day].pos++;
      if (c.sentimenttype === 'negative') dayMap[day].neg++;
    });
    const sentimentDays: SentimentDay[] = Object.entries(dayMap).map(([date, v]) => {
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (v.pos > v.neg) sentiment = 'positive';
      else if (v.neg > v.pos) sentiment = 'negative';
      return {
        date,
        score: v.score,
        sentiment,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
    setMetrics({
      totalPositiveScore,
      totalNegativeScore,
      positiveCount,
      negativeCount,
      overallScore,
      sentimentDays,
    });
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Analysis Dashboard</h1>
      {loading ? (
        <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-700 rounded" />
      ) : (
        <div className="space-y-6">
          <Card>
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
          <Card>
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
