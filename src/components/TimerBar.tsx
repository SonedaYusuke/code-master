import { TIME_LIMIT_MS } from '../lib/scoring';

const DANGER_MS = 2000;

export default function TimerBar({ remainingMs, timeLimitMs = TIME_LIMIT_MS }: { remainingMs: number; timeLimitMs?: number }) {
  return (
    <div
      className={remainingMs <= DANGER_MS ? 'timer danger' : 'timer'}
      role="progressbar"
      aria-label="残り時間"
      aria-valuemin={0}
      aria-valuemax={timeLimitMs / 1000}
      aria-valuenow={Math.ceil(remainingMs / 1000)}
    >
      <div className="timer-bar" style={{ width: `${(remainingMs / timeLimitMs) * 100}%` }} />
    </div>
  );
}
