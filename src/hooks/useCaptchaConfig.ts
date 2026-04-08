import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';

interface CaptchaConfig {
  siteKey: string | null;
}

let cachedConfig: CaptchaConfig | null = null;
let inflightRequest: Promise<CaptchaConfig> | null = null;

export function useCaptchaConfig() {
  const [config, setConfig] = useState<CaptchaConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedConfig) return;

    if (!inflightRequest) {
      inflightRequest = api
        .getCaptchaConfig()
        .then((result) => {
          cachedConfig = result;
          return result;
        })
        .finally(() => {
          inflightRequest = null;
        });
    }

    inflightRequest
      ?.then(setConfig)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading, error };
}
