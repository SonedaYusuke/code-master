import { describe, expect, it } from 'vitest';
import { NOTES } from '../model';
import { chordsOfLevel } from '../data/chords';
import { buildQuestion, displayRoot, parseChordId, rootAndType } from './buildQuestion';

function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

describe('parseChordId', () => {
  it('早見表の id をルートとタイプに分ける', () => {
    expect(parseChordId('C')).toEqual({ root: 'C', type: '' });
    expect(parseChordId('F#m7b5')).toEqual({ root: 'F#', type: 'm7b5' });
    expect(parseChordId('A#maj7')).toEqual({ root: 'A#', type: 'maj7' });
  });

  it('知らないタイプは例外を投げる', () => {
    expect(() => parseChordId('C13')).toThrow();
  });
});

describe('rootAndType', () => {
  it('レベルのコードから、ルート・タイプ・♭表記かどうかを取り出す', () => {
    const bFlat = chordsOfLevel(2).find((c) => c.name === 'B♭')!;
    expect(rootAndType(bFlat)).toEqual({ root: 'A#', type: '', preferFlat: true });
    const bm7b5 = chordsOfLevel(8).find((c) => c.name === 'Bm7♭5')!;
    expect(rootAndType(bm7b5)).toEqual({ root: 'B', type: 'm7b5', preferFlat: false });
  });
});

describe('displayRoot', () => {
  it('♭表記のコードでは、黒鍵の音を ♭ で書く', () => {
    expect(displayRoot('A#', true)).toBe('B♭');
    expect(displayRoot('A#', false)).toBe('A#');
    expect(displayRoot('C', true)).toBe('C');
  });
});

describe('buildQuestion', () => {
  it('ルートの選択肢は、正解と半音・全音ずれた音の4つ', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 100; i++) {
      const q = buildQuestion({ root: 'C', type: '', preferFlat: false }, ['', 'm'], rng);
      expect(q.rootChoices).toHaveLength(4);
      expect(new Set(q.rootChoices).size).toBe(4);
      expect(q.rootChoices).toContain('C');
      for (const note of q.rootChoices) expect(['A#', 'B', 'C', 'C#', 'D']).toContain(note);
    }
  });

  it('タイプの選択肢は、出題範囲のタイプを優先し、足りなければ近いタイプで補う', () => {
    const rng = seededRng(2);
    for (let i = 0; i < 50; i++) {
      const q = buildQuestion({ root: 'E', type: 'm', preferFlat: false }, ['', 'm', '7', 'm7', 'maj7'], rng);
      expect(q.typeChoices).toHaveLength(4);
      expect(new Set(q.typeChoices).size).toBe(4);
      expect(q.typeChoices).toContain('m');
      for (const type of q.typeChoices) expect(['', 'm', '7', 'm7', 'maj7']).toContain(type);
    }
    const few = buildQuestion({ root: 'E', type: 'm', preferFlat: false }, ['m'], seededRng(3));
    expect(few.typeChoices).toHaveLength(4);
    expect(new Set(few.typeChoices).size).toBe(4);
  });

  it('正解のルートとタイプを持つ', () => {
    const q = buildQuestion({ root: NOTES[3], type: '7', preferFlat: true }, ['7'], seededRng(4));
    expect(q).toMatchObject({ root: 'D#', type: '7', preferFlat: true });
  });
});
