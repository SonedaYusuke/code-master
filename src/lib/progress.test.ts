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
    saveResult(1, 90, storage);
    expect(loadProgress(storage)).toEqual({ 1: { bestScore: 90, cleared: true } });
  });

  it('壊れた JSON なら空', () => {
    expect(loadProgress(memoryStorage('{not json'))).toEqual({});
  });

  it('不正な値のレベルだけ無視する', () => {
    const raw = JSON.stringify({ 1: { bestScore: 70 }, 2: { bestScore: 'x' }, 3: { bestScore: 150 }, 9: { bestScore: 50 } });
    expect(loadProgress(memoryStorage(raw))).toEqual({ 1: { bestScore: 70, cleared: false } });
  });

  it('storage が使えない・例外を投げるなら空', () => {
    expect(loadProgress(null)).toEqual({});
    expect(loadProgress(throwingStorage)).toEqual({});
  });
});

describe('saveResult', () => {
  it('80% 以上でクリアになる', () => {
    expect(saveResult(2, 80, memoryStorage())[2]).toEqual({ bestScore: 80, cleared: true });
    expect(saveResult(2, 79, memoryStorage())[2]).toEqual({ bestScore: 79, cleared: false });
  });

  it('最高値より低いスコアでは更新しない', () => {
    const storage = memoryStorage();
    saveResult(1, 90, storage);
    saveResult(1, 50, storage);
    expect(loadProgress(storage)[1]).toEqual({ bestScore: 90, cleared: true });
  });

  it('他のレベルの記録を消さない', () => {
    const storage = memoryStorage();
    saveResult(1, 90, storage);
    saveResult(2, 40, storage);
    expect(loadProgress(storage)).toEqual({
      1: { bestScore: 90, cleared: true },
      2: { bestScore: 40, cleared: false },
    });
  });

  it('storage が例外を投げても落ちずに結果を返す', () => {
    expect(saveResult(1, 90, throwingStorage)[1]).toEqual({ bestScore: 90, cleared: true });
  });
});
