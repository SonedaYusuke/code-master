import { LEVELS, type Level } from '../model';

export type LevelProgress = { bestScore: number; bestPoints: number; cleared: boolean };
export type Progress = Partial<Record<Level, LevelProgress>>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** レベル構成を見直すたびにバージョンを上げて、以前の記録をリセットする */
export const STORAGE_KEY = 'code-master:progress:v4';
export const CLEAR_THRESHOLD = 80;

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const isValidNumber = (value: unknown, max = Infinity): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

function toLevelProgress(value: unknown): LevelProgress | null {
  if (typeof value !== 'object' || value === null) return null;
  const { bestScore, bestPoints } = value as { bestScore?: unknown; bestPoints?: unknown };
  if (!isValidNumber(bestScore, 100)) return null;
  // ポイント導入前の記録には bestPoints がないので 0 として扱う
  return {
    bestScore,
    bestPoints: isValidNumber(bestPoints) ? bestPoints : 0,
    cleared: bestScore >= CLEAR_THRESHOLD,
  };
}

export function loadProgress(storage: StorageLike | null = defaultStorage()): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const progress: Progress = {};
    for (const level of LEVELS) {
      const entry = toLevelProgress((parsed as Record<string, unknown>)[level]);
      if (entry) progress[level] = entry;
    }
    return progress;
  } catch {
    return {};
  }
}

export function saveResult(
  level: Level,
  result: { score: number; points: number },
  storage: StorageLike | null = defaultStorage(),
): { progress: Progress; newHighScore: boolean } {
  const current = loadProgress(storage);
  const previous = current[level];
  const bestScore = Math.max(previous?.bestScore ?? 0, result.score);
  const bestPoints = Math.max(previous?.bestPoints ?? 0, result.points);
  const newHighScore = result.points > (previous?.bestPoints ?? 0);
  if (previous && bestScore === previous.bestScore && bestPoints === previous.bestPoints) {
    return { progress: current, newHighScore };
  }
  const progress: Progress = {
    ...current,
    [level]: { bestScore, bestPoints, cleared: bestScore >= CLEAR_THRESHOLD },
  };
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 保存できなくても、今回の結果はそのまま返す
  }
  return { progress, newHighScore };
}
