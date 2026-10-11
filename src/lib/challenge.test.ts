import { describe, expect, it } from 'vitest';
import type { ChartType } from '../data/chart';
import { MAX_LIVES, MAX_QUESTIONS, buildPool, buildShapeChoices, isFinished, nextQuestion } from './challenge';

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

describe('buildShapeChoices', () => {
  it('正解の形を含む4つの形で、名前が重ならない', () => {
    const items = pool(['', 'm', '7', 'm7']);
    const rng = seededRng(5);
    for (let i = 0; i < 100; i++) {
      const item = nextQuestion(items, null, rng).item;
      const choices = buildShapeChoices(item, rng);
      expect(choices).toHaveLength(4);
      expect(choices.filter((c) => c.voicing.id === item.voicing.id)).toHaveLength(1);
      expect(new Set(choices.map((c) => c.name)).size).toBe(4);
      expect(new Set(choices.map((c) => JSON.stringify(c.voicing.frets))).size).toBe(4);
    }
  });

  it('不正解の形は、同じタイプか同じルートのコードの、演奏で使う形にする', () => {
    const items = pool(['m7']);
    const allPlayable = new Set(buildPool(new Set<ChartType>(['', 'm', '7', 'm7', 'maj7', 'sus4', 'add9', 'm7b5', 'dim', 'dim7', 'aug', '6', 'sus2', '9'])).map((c) => c.voicing.id));
    const rng = seededRng(6);
    for (let i = 0; i < 100; i++) {
      const item = nextQuestion(items, null, rng).item;
      for (const choice of buildShapeChoices(item, rng)) {
        expect(choice.type === item.type || choice.root === item.root).toBe(true);
        expect(allPlayable.has(choice.voicing.id)).toBe(true);
      }
    }
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
