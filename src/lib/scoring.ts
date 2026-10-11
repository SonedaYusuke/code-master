import type { QuizMode } from './quiz';

/** 4択の制限時間 */
export const TIME_LIMIT_MS = 10000;
/** ルート＋タイプは2回答えるので長めにする */
export const BUILD_TIME_LIMIT_MS = 10000;

export function timeLimitFor(mode: QuizMode): number {
  return mode === 'build' ? BUILD_TIME_LIMIT_MS : TIME_LIMIT_MS;
}

export const BASE_POINTS = 100;
export const MAX_TIME_BONUS = 100;
export const COMBO_STEP = 20;
export const MAX_COMBO_BONUS = 100;

/** combo は、この回答を含めた連続正解数 */
export function pointsFor(correct: boolean, remainingMs: number, combo: number, timeLimitMs = TIME_LIMIT_MS): number {
  if (!correct) return 0;
  const remaining = Math.min(Math.max(remainingMs, 0), timeLimitMs);
  const timeBonus = Math.round((remaining / timeLimitMs) * MAX_TIME_BONUS);
  const comboBonus = Math.min(Math.max(combo - 1, 0) * COMBO_STEP, MAX_COMBO_BONUS);
  return BASE_POINTS + timeBonus + comboBonus;
}
