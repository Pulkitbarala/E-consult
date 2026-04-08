import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RollingDigitsProps {
  value: number;
  className?: string;
  label?: string;
  durationMs?: number;
}

const DIGIT_LIST = Array.from({ length: 10 }, (_, i) => i);

const RollingDigits: React.FC<RollingDigitsProps> = ({
  value,
  className,
  label,
  durationMs = 1200,
}) => {
  const hasMountedRef = useRef(false);
  const [isReady, setIsReady] = useState(
    () => typeof window !== 'undefined' && document.readyState === 'complete'
  );
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isReady || typeof window === 'undefined') return undefined;

    const handleLoad = () => setIsReady(true);
    window.addEventListener('load', handleLoad, { once: true });

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [isReady]);

  useEffect(() => {
    let rafId: number | null = null;

    if (!isReady) {
      setDisplayValue(0);
      return undefined;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setDisplayValue(0);
      rafId = window.requestAnimationFrame(() => {
        setDisplayValue(value);
      });
    } else {
      setDisplayValue(value);
    }

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [value, isReady]);

  const formatted = useMemo(() => {
    const safeValue = Number.isFinite(displayValue) ? displayValue : 0;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(safeValue);
  }, [displayValue]);

  return (
    <span className={cn('rolling-digits', className)} aria-label={label ?? formatted} role="text">
      {formatted.split('').map((char, index) => {
        if (char < '0' || char > '9') {
          return (
            <span key={`sep-${index}`} className="rolling-separator" aria-hidden="true">
              {char}
            </span>
          );
        }

        const digit = Number(char);
        const style = {
          '--digit': digit,
          '--duration-ms': `${durationMs}ms`,
        } as React.CSSProperties;

        return (
          <span key={`digit-${index}`} className="rolling-digit" style={style}>
            <span className="rolling-digit-track" aria-hidden="true">
              {DIGIT_LIST.map((slot) => (
                <span key={slot} className="rolling-digit-slot">
                  {slot}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default RollingDigits;
