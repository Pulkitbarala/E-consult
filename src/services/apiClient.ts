import { supabase } from '@/integrations/supabase/client';

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:4000';

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

const DEFAULT_TIMEOUT_MS = 10000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const maxRetries = isGet ? 2 : 0;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {
        ...(options.headers || {}),
      };
      // Only set JSON content type when we actually send a body
      if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok) {
        let details: any = undefined;
        try {
          details = await res.json();
        } catch {}
        const message = details?.error || details?.message || res.statusText;
        const error = new Error(message) as any;
        error.status = res.status;
        error.details = details;
        throw error;
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json() as Promise<T>;
      }
      return {} as T;
    } catch (error: any) {
      lastError = error;
      const status = error?.status as number | undefined;
      const isAbort = error?.name === 'AbortError';
      const shouldRetry = isGet && (isAbort || (status ? RETRYABLE_STATUS.has(status) : true));

      if (!shouldRetry || attempt >= maxRetries) {
        console.error('API Request Error:', {
          path,
          status,
          message: error?.message,
          details: error?.details,
        });
        throw error;
      }

      const backoffMs = 400 * Math.pow(2, attempt);
      await sleep(backoffMs);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

export const api = {
  signIn: (payload: { email: string; password: string; captchaToken?: string | null }) =>
    request<{ user: any; access_token: string | null; refresh_token: string | null; expires_at: number | null }>(
      '/auth/sign-in',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getCaptchaConfig: () => request<{ siteKey: string | null }>('/auth/turnstile'),
  signUp: (payload: { email: string; password: string; displayName: string; redirectUrl?: string; captchaToken?: string | null }) =>
    request<{ user: any }>('/auth/sign-up', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { email: string; redirectTo: string; captchaToken?: string | null }) =>
    request<{ ok: true }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  updatePassword: (payload: { password: string }) =>
    request<{ ok: true }>('/auth/update-password', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request<{ profile: { user_id: string; display_name: string; bio?: string | null } | null }>(
    '/profile'
  ),
  updateProfile: (payload: { display_name: string; bio?: string | null }) =>
    request<{ ok: true }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getAuthProfile: () => request<{ user: any }>('/auth/profile'),
  listConsultations: () => request<{ items: any[] }>('/consultations'),
  createConsultation: (payload: { title: string; description: string; category?: string; expires_at?: string }) =>
    request<{ item: any }>('/consultations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStats: () => request<{ totalConsultations: number; activeNow: number; commentsPosted: number }>('/stats'),
  listMyConsultations: () => request<{ items: any[] }>('/consultations/mine'),
  expireConsultation: (id: string) =>
    request<{ item: { id: string; expires_at: string } }>(`/consultations/${id}/expire`, { method: 'POST' }),
  getConsultation: (id: string) => request<{ item: any }>(`/consultations/${id}`),
  updateConsultation: (id: string, payload: { title: string; description: string }) =>
    request<{ ok: true }>(`/consultations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getComments: (id: string) => request<{ items: any[] }>(`/consultations/${id}/comments`),
  postComment: (id: string, payload: { content: string }) =>
    request<{ item: any }>(`/consultations/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  toggleLike: (commentId: string) => request<{ liked: boolean }>(`/comments/${commentId}/like`, { method: 'POST' }),
  updateComment: (commentId: string, payload: { content: string }) =>
    request<{ ok: true }>(`/comments/${commentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteComment: (commentId: string) => request<{ ok: true }>(`/comments/${commentId}`, { method: 'DELETE' }),
  listCommentedConsultations: () =>
    request<{ consultations: any[] }>('/commented-consultations'),
  getAnalysisData: (consultationId?: string) =>
    request<{ consultations: any[]; comments: any[]; metrics: any }>(
      `/analysis${consultationId ? `?consultationId=${consultationId}` : ''}`
    ),
  exportCommentsCsv: async (consultationId: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${BASE_URL}/consultations/${consultationId}/export-csv`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });

    if (!res.ok) throw new Error(`Failed to export CSV: ${res.statusText}`);
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation-${consultationId}-comments.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

