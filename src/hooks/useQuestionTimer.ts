import { useEffect, useRef, useState } from 'react';
import { TIME_LIMIT_MS } from '../lib/scoring';

const TICK_MS = 50;

/**
 * 1問ごとの制限時間。running の間だけ減り、questionKey が変わるたびに満タンから始める。
 * 残りが 0 になった瞬間に onTimeout を呼ぶ（前の問題の残り 0 を次の問題に持ち越さないため、
 * 判定は表示用の state ではなくタイマーの中で行う）。
 * stop は回答した瞬間の残り時間を返して、表示もその値で止める
 */
export function useQuestionTimer(
  running: boolean,
  questionKey: number,
  onTimeout: () => void,
  timeLimitMs = TIME_LIMIT_MS,
) {
  const [remainingMs, setRemainingMs] = useState(timeLimitMs);
  const deadline = useRef(0);
  const timeoutHandler = useRef(onTimeout);
  timeoutHandler.current = onTimeout;

  useEffect(() => {
    if (!running) return;
    deadline.current = performance.now() + timeLimitMs;
    setRemainingMs(timeLimitMs);
    const timer = setInterval(() => {
      const remaining = Math.max(0, deadline.current - performance.now());
      setRemainingMs(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        timeoutHandler.current();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, questionKey, timeLimitMs]);

  function stop(): number {
    const remaining = Math.max(0, deadline.current - performance.now());
    setRemainingMs(remaining);
    return remaining;
  }

  return { remainingMs, stop };
}
