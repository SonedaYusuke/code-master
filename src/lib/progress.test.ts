import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadProgress, saveResult } from './progress';

function memoryStorage(initial: string | null = null) {
  const data = new Map<string, string>();
  if (initial !== null) data.set(STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const throwingStorage = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('denied'); },
};

describe('loadProgress', () => {
  it('記録がなければ空', () => {
    expect(loadProgress(memoryStorage())).toEqual({});
  });

  it('保存した記録を読める', () => {
    const storage = memoryStorage();
    saveResult(1, { score: 90, points: 2100 }, storage);
    expect(loadProgress(storage)).toEqual({ 1: { bestScore: 90, bestPoints: 2100, cleared: true } });
  });

  it('ポイントがない以前の記録は 0pt として読む', () => {
    expect(loadProgress(memoryStorage(JSON.stringify({ 2: { bestScore: 60, cleared: false } })))).toEqual({
      2: { bestScore: 60, bestPoints: 0, cleared: false },
    });
  });

  it('壊れた JSON なら空', () => {
    expect(loadProgress(memoryStorage('{not json'))).toEqual({});
  });

  it('不正な値のレベルだけ無視する', () => {
    const raw = JSON.stringify({
      1: { bestScore: 70, bestPoints: -5 },
      2: { bestScore: 'x' },
      3: { bestScore: 150 },
      10: { bestScore: 50 },
    });
    expect(loadProgress(memoryStorage(raw))).toEqual({ 1: { bestScore: 70, bestPoints: 0, cleared: false } });
  });

  it('storage が使えない・例外を投げるなら空', () => {
    expect(loadProgress(null)).toEqual({});
    expect(loadProgress(throwingStorage)).toEqual({});
  });
});

describe('モードごとの記録', () => {
  it('4択とルート＋タイプの記録は別々に保存する', () => {
    const storage = memoryStorage();
    saveResult(1, { score: 90, points: 2000 }, storage, 'choice');
    saveResult(1, { score: 60, points: 3000 }, storage, 'build');
    saveResult(1, { score: 70, points: 1000 }, storage, 'shape');
    expect(loadProgress(storage, 'shape')[1]?.bestPoints).toBe(1000);
    expect(loadProgress(storage, 'choice')[1]).toEqual({ bestScore: 90, bestPoints: 2000, cleared: true });
    expect(loadProgress(storage, 'build')[1]).toEqual({ bestScore: 60, bestPoints: 3000, cleared: false });
    expect(loadProgress(storage)[1]?.bestPoints).toBe(2000);
  });
});

describe('saveResult', () => {
  it('80% 以上でクリアになる', () => {
    expect(saveResult(2, { score: 80, points: 0 }, memoryStorage()).progress[2]?.cleared).toBe(true);
    expect(saveResult(2, { score: 79, points: 0 }, memoryStorage()).progress[2]?.cleared).toBe(false);
  });

  it('正答率とポイントはそれぞれ最高値だけを残す', () => {
    const storage = memoryStorage();
    saveResult(1, { score: 90, points: 1500 }, storage);
    saveResult(1, { score: 50, points: 1800 }, storage);
    expect(loadProgress(storage)[1]).toEqual({ bestScore: 90, bestPoints: 1800, cleared: true });
  });

  it('ハイスコアを超えたときだけ newHighScore になる', () => {
    const storage = memoryStorage();
    expect(saveResult(1, { score: 50, points: 1000 }, storage).newHighScore).toBe(true);
    expect(saveResult(1, { score: 50, points: 1000 }, storage).newHighScore).toBe(false);
    expect(saveResult(1, { score: 50, points: 900 }, storage).newHighScore).toBe(false);
    expect(saveResult(1, { score: 50, points: 1001 }, storage).newHighScore).toBe(true);
  });

  it('0pt はハイスコア更新にしない', () => {
    expect(saveResult(1, { score: 0, points: 0 }, memoryStorage()).newHighScore).toBe(false);
  });

  it('他のレベルの記録を消さない', () => {
    const storage = memoryStorage();
    saveResult(1, { score: 90, points: 2000 }, storage);
    saveResult(2, { score: 40, points: 500 }, storage);
    expect(loadProgress(storage)).toEqual({
      1: { bestScore: 90, bestPoints: 2000, cleared: true },
      2: { bestScore: 40, bestPoints: 500, cleared: false },
    });
  });

  it('storage が例外を投げても落ちずに結果を返す', () => {
    expect(saveResult(1, { score: 90, points: 2000 }, throwingStorage)).toEqual({
      progress: { 1: { bestScore: 90, bestPoints: 2000, cleared: true } },
      newHighScore: true,
    });
  });
});
