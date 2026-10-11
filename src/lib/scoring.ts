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

/** questionCount 問を、すべて一瞬で正解したときの理論値 */
export function maxPointsFor(questionCount: number): number {
  let total = 0;
  for (let combo = 1; combo <= questionCount; combo++) total += pointsFor(true, TIME_LIMIT_MS, combo);
  return total;
}

/** 称号。理論値に対する割合（%）が min 以上ならその称号。低い順 */
export const RANKS = [
  { min: 0, name: 'ギター初心者' },
  { min: 20, name: 'ギター見習い' },
  { min: 40, name: '駆け出しバンドマン' },
  { min: 60, name: '売れっ子ギタリスト' },
  { min: 80, name: 'ギターヒーロー' },
] as const;

export function rankFor(points: number, maxPoints: number): string {
  const percent = maxPoints === 0 ? 0 : (points / maxPoints) * 100;
  return [...RANKS].reverse().find((rank) => percent >= rank.min)!.name;
}
