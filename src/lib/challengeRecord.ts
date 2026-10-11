import { CHART_TYPES, CHART_TYPE_LABELS, type ChartType } from '../data/chart';
import type { QuizMode } from './quiz';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const CHALLENGE_STORAGE_KEY = 'code-master:challenge:v1';

function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** タイプの組み合わせごとに記録を分けるためのキー（例: "M,m,m7"） */
export function selectionKey(types: ReadonlySet<ChartType>): string {
  return CHART_TYPES.filter((type) => types.has(type)).map((type) => CHART_TYPE_LABELS[type]).join(',');
}

/** 4択の記録は以前からのキーのまま、ほかのモードはモード名を前に付けて分ける */
export function challengeRecordKey(types: ReadonlySet<ChartType>, mode: QuizMode): string {
  const key = selectionKey(types);
  return mode === 'choice' ? key : `${mode}:${key}`;
}

function loadAll(storage: StorageLike | null): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(CHALLENGE_STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] >= 0),
    );
  } catch {
    return {};
  }
}

export function loadChallengeBest(key: string, storage: StorageLike | null = defaultStorage()): number {
  return loadAll(storage)[key] ?? 0;
}

export function saveChallengeResult(
  key: string,
  points: number,
  storage: StorageLike | null = defaultStorage(),
): { best: number; newHighScore: boolean } {
  const all = loadAll(storage);
  const previous = all[key] ?? 0;
  if (points <= previous) return { best: previous, newHighScore: false };
  try {
    storage?.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ ...all, [key]: points }));
  } catch {
    // 保存できなくても、今回の結果はそのまま返す
  }
  return { best: points, newHighScore: true };
}
