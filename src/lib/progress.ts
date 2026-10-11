import { LEVELS, type Level } from '../model';

export type LevelProgress = { bestScore: number; cleared: boolean };
export type Progress = Partial<Record<Level, LevelProgress>>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const STORAGE_KEY = 'code-master:progress';
export const CLEAR_THRESHOLD = 80;

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function toLevelProgress(value: unknown): LevelProgress | null {
  if (typeof value !== 'object' || value === null) return null;
  const { bestScore } = value as { bestScore?: unknown };
  if (typeof bestScore !== 'number' || !Number.isFinite(bestScore) || bestScore < 0 || bestScore > 100) return null;
  return { bestScore, cleared: bestScore >= CLEAR_THRESHOLD };
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

export function saveResult(level: Level, score: number, storage: StorageLike | null = defaultStorage()): Progress {
  const current = loadProgress(storage);
  const best = current[level]?.bestScore;
  if (best !== undefined && score <= best) return current;
  const next: Progress = { ...current, [level]: { bestScore: score, cleared: score >= CLEAR_THRESHOLD } };
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても、今回の結果はそのまま返す
  }
  return next;
}
