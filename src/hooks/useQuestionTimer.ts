import { useEffect, useRef, useState } from 'react';
import { TIME_LIMIT_MS } from '../lib/scoring';

const TICK_MS = 50;

/**
 * 1問ごとの制限時間。running の間だけ減り、questionKey が変わるたびに満タンから始める。
 * stop は回答した瞬間の残り時間を返して、表示もその値で止める
 */
export function useQuestionTimer(running: boolean, questionKey: number) {
  const [remainingMs, setRemainingMs] = useState(TIME_LIMIT_MS);
  const deadline = useRef(0);

  useEffect(() => {
    if (!running) return;
    deadline.current = performance.now() + TIME_LIMIT_MS;
    setRemainingMs(TIME_LIMIT_MS);
    const timer = setInterval(() => {
      setRemainingMs(Math.max(0, deadline.current - performance.now()));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, questionKey]);

  function stop(): number {
    const remaining = Math.max(0, deadline.current - performance.now());
    setRemainingMs(remaining);
    return remaining;
  }

  return { remainingMs, stop };
}
