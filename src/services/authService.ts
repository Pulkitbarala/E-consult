import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/apiClient';

export async function signInWithEmail(
  email: string,
  password: string,
  captchaToken?: string | null
) {
  const res = await api.signIn({ email, password, captchaToken });
  if (res.access_token && res.refresh_token) {
    await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
    return { data: { session: { access_token: res.access_token } }, error: null as any };
  }
  return { data: null, error: { message: 'Sign-in failed' } as any };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  captchaToken?: string | null
) {
  const redirectUrl = (import.meta.env.VITE_AUTH_REDIRECT as string) || `${window.location.origin}/auth`;
  const data = await api.signUp({ email, password, displayName, redirectUrl, captchaToken });
  return { data, error: null } as any;
}

export async function sendResetPasswordEmail(email: string, captchaToken?: string | null) {
  const data = await api.resetPassword({
    email,
    redirectTo: `${window.location.origin}/update-password`,
    captchaToken,
  });
  return { data, error: null } as any;
}

export async function updatePassword(password: string) {
  const data = await api.updatePassword({ password });
  return { data, error: null } as any;
}
