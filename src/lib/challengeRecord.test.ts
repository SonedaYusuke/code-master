import { describe, expect, it } from 'vitest';
import type { ChartType } from '../data/chart';
import { CHALLENGE_STORAGE_KEY, challengeRecordKey, loadChallengeBest, saveChallengeResult, selectionKey } from './challengeRecord';

function memoryStorage(initial: string | null = null) {
  const data = new Map<string, string>();
  if (initial !== null) data.set(CHALLENGE_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('selectionKey', () => {
  it('選んだ順番に関係なく、タイプ順の同じキーになる', () => {
    expect(selectionKey(new Set<ChartType>(['m7', '', 'm']))).toBe('M,m,m7');
    expect(selectionKey(new Set<ChartType>(['m', 'm7', '']))).toBe('M,m,m7');
  });
});

describe('challengeRecordKey', () => {
  it('ルート＋タイプのモードは、4択と別の記録にする', () => {
    const types = new Set<ChartType>(['', 'm']);
    expect(challengeRecordKey(types, 'choice')).toBe('M,m');
    expect(challengeRecordKey(types, 'build')).toBe('build:M,m');
  });
});

describe('challenge record', () => {
  it('記録がなければ 0', () => {
    expect(loadChallengeBest('M', memoryStorage())).toBe(0);
  });

  it('組み合わせごとに最高ポイントを残す', () => {
    const storage = memoryStorage();
    expect(saveChallengeResult('M,m', 1200, storage)).toEqual({ best: 1200, newHighScore: true });
    expect(saveChallengeResult('M,m', 800, storage)).toEqual({ best: 1200, newHighScore: false });
    expect(saveChallengeResult('7', 500, storage)).toEqual({ best: 500, newHighScore: true });
    expect(loadChallengeBest('M,m', storage)).toBe(1200);
    expect(loadChallengeBest('7', storage)).toBe(500);
  });

  it('0pt はハイスコア更新にしない', () => {
    expect(saveChallengeResult('M', 0, memoryStorage()).newHighScore).toBe(false);
  });

  it('壊れた値や例外でも落ちない', () => {
    expect(loadChallengeBest('M', memoryStorage('{oops'))).toBe(0);
    const throwing = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } };
    expect(loadChallengeBest('M', throwing)).toBe(0);
    expect(saveChallengeResult('M', 300, throwing)).toEqual({ best: 300, newHighScore: true });
  });
});
