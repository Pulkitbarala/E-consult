import Turnstile from 'react-turnstile';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCaptchaConfig } from '@/hooks/useCaptchaConfig';

interface CaptchaProps {
  onToken: (token: string | null) => void;
  resetSignal?: number;
}

export function Captcha({ onToken, resetSignal }: CaptchaProps) {
  const { toast } = useToast();
  const { config, loading, error } = useCaptchaConfig();
  const [key, setKey] = useState(0);
  const sitekey = config?.siteKey ?? null;
  const required = Boolean(sitekey);

  const theme = useMemo(
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    []
  );

  useEffect(() => () => onToken(null), [onToken]);

  useEffect(() => {
    if (resetSignal == null) return;
    setKey((k) => k + 1);
    onToken(null);
  }, [resetSignal, onToken]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Captcha unavailable', description: 'Try again later.', variant: 'destructive' });
    }
  }, [error, toast]);

  if (loading || !required) return null;

  return (
    <div className="flex justify-center py-2">
      <Turnstile
        key={key}
        sitekey={sitekey!}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onLoad={() => console.info('Turnstile loaded')}
        onUnsupported={() =>
          toast({
            title: 'Captcha unsupported',
            description: 'Your browser does not support Turnstile.',
            variant: 'destructive',
          })
        }
        onError={(err) => {
          console.error('Turnstile error:', err);
          onToken(null);
          toast({
            title: 'Captcha failed to load',
            description: 'Try again later.',
            variant: 'destructive',
          });
          setKey((k) => k + 1);
        }}
        theme={theme as any}
        size="flexible"
        appearance="always"
        execution="render"
        retry="auto"
        refreshExpired="auto"
      />
    </div>
  );
}
