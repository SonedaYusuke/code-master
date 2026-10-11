import { describe, expect, it } from 'vitest';
import type { ChartType } from '../data/chart';
import { MAX_LIVES, MAX_QUESTIONS, buildPool, isFinished, nextQuestion } from './challenge';

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

const pool = (types: ChartType[]) => buildPool(new Set(types));
const has = (types: ChartType[], chordId: string, label: string) =>
  pool(types).some((item) => item.chordId === chordId && item.voicing.label === label);

describe('buildPool', () => {
  it('選んだタイプの形だけを集める', () => {
    const items = pool(['m', '7']);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.type === 'm' || item.type === '7')).toBe(true);
  });

  it('何も選ばなければ空', () => {
    expect(pool([])).toEqual([]);
  });

  it('10フレット以上の高いポジションの形は省く', () => {
    expect(has([''], 'C', '4弦ルート')).toBe(false); // 10フレット
    expect(has([''], 'D#', '6弦ルート')).toBe(false); // 11フレット
    expect(has([''], 'C', '6弦ルート')).toBe(true); // 8フレット
  });

  it('4弦ルートは M・m・7 だけ残す', () => {
    expect(has([''], 'F', '4弦ルート')).toBe(true);
    expect(has(['m'], 'F#m', '4弦ルート')).toBe(true);
    expect(has(['7'], 'E7', '4弦ルート')).toBe(true);
    expect(pool(['m7', 'maj7', 'sus4', 'dim7', '9']).some((item) => item.voicing.label === '4弦ルート')).toBe(false);
  });

  it('6弦ルートの add9 は省く', () => {
    expect(pool(['add9']).some((item) => item.voicing.label === '6弦ルート')).toBe(false);
    expect(has(['add9'], 'Cadd9', 'オープン')).toBe(true);
  });

  it('オープンの形は残す', () => {
    expect(has([''], 'C', 'オープン')).toBe(true);
    expect(has(['7'], 'B7', 'オープン')).toBe(true);
  });
});

describe('nextQuestion', () => {
  it('選択肢は4つで名前が重ならず、正解の名前を含む', () => {
    const items = pool(['', 'm', '7', 'm7']);
    const rng = seededRng(1);
    for (let i = 0; i < 200; i++) {
      const q = nextQuestion(items, null, rng);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.item.name);
    }
  });

  it('不正解の選択肢は、同じタイプか同じルートのコードにする', () => {
    const items = pool(['m']);
    const rng = seededRng(2);
    for (let i = 0; i < 100; i++) {
      const q = nextQuestion(items, null, rng);
      const root = q.item.root;
      for (const name of q.choices.filter((n) => n !== q.item.name)) {
        expect(name.endsWith('m') || name.startsWith(root)).toBe(true);
      }
    }
  });

  it('同じ形を2問続けて出さない', () => {
    const items = pool(['']);
    const rng = seededRng(3);
    let previous = nextQuestion(items, null, rng).item;
    for (let i = 0; i < 200; i++) {
      const current = nextQuestion(items, previous, rng).item;
      expect(current.voicing.id).not.toBe(previous.voicing.id);
      previous = current;
    }
  });

  it('形が1つしかなければ同じ形を出す', () => {
    const items = pool(['']).slice(0, 1);
    expect(nextQuestion(items, items[0], seededRng(4)).item).toBe(items[0]);
  });

  it('出題する形がなければ例外を投げる', () => {
    expect(() => nextQuestion([], null)).toThrow();
  });
});

describe('isFinished', () => {
  it('ライフが0になるか、最大問題数に達したら終了', () => {
    expect(isFinished(MAX_LIVES, 1)).toBe(false);
    expect(isFinished(0, 5)).toBe(true);
    expect(isFinished(1, MAX_QUESTIONS)).toBe(true);
    expect(isFinished(1, MAX_QUESTIONS - 1)).toBe(false);
  });
});
