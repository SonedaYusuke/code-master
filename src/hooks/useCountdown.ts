import { useEffect, useState } from 'react';

const COUNTDOWN_SECONDS = 3;

/** 開始前の「3・2・1」。0 になったら開始 */
export function useCountdown(): number {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  return countdown;
}
