export const TIME_LIMIT_MS = 5000;
const BASE_POINTS = 100;
const MAX_TIME_BONUS = 100;
const COMBO_STEP = 20;
const MAX_COMBO_BONUS = 100;

/** combo は、この回答を含めた連続正解数 */
export function pointsFor(correct: boolean, remainingMs: number, combo: number): number {
  if (!correct) return 0;
  const remaining = Math.min(Math.max(remainingMs, 0), TIME_LIMIT_MS);
  const timeBonus = Math.round((remaining / TIME_LIMIT_MS) * MAX_TIME_BONUS);
  const comboBonus = Math.min(Math.max(combo - 1, 0) * COMBO_STEP, MAX_COMBO_BONUS);
  return BASE_POINTS + timeBonus + comboBonus;
}
