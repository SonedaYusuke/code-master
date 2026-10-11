import { describe, expect, it } from 'vitest';
import { LEVELS, type Level } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from './chords';
import { expectedTones } from './expectedTones';

const EXPECTED_NAMES: Record<Level, string[]> = {
  1: ['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em'],
  2: ['F', 'B', 'Bm', 'B♭', 'F#m', 'Cm', 'Gm', 'C#m', 'Fm', 'E♭', 'A♭'],
  3: ['A7', 'B7', 'C7', 'D7', 'E7', 'G7', 'Am7', 'Dm7', 'Em7'],
  4: ['CM7', 'DM7', 'GM7', 'AM7', 'FM7', 'B♭M7', 'F#m7', 'Gm7', 'Bm7', 'Cm7'],
  5: ['F7', 'G7', 'A7', 'B♭7', 'B7', 'C7', 'D7', 'E7'],
  6: ['Asus4', 'Dsus4', 'Esus4', 'Csus4', 'Asus2', 'Dsus2', 'Cadd9', 'Gadd9', 'Eadd9', 'Aadd9'],
  7: ['A6', 'C6', 'G6', 'E9', 'C9', 'G9', 'Gsus4', 'Bsus4', 'Fadd9', 'Dadd9'],
  8: ['Am7♭5', 'Bm7♭5', 'F#m7♭5', 'Bdim', 'Cdim', 'C#dim7', 'Gdim7', 'Edim7', 'Caug', 'Eaug'],
  9: ['F', 'Fm', 'FM7', 'F#m'],
};

const byLevelAndName = (level: Level, name: string) => chordsOfLevel(level).find((c) => c.name === name)!;

describe('CHORDS', () => {
  it('レベルは9つ', () => {
    expect([...LEVELS]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(LEVELS)('Lv%i に決めたとおりのコードが入っている', (level) => {
    expect(chordsOfLevel(level).map((c) => c.name)).toEqual(EXPECTED_NAMES[level]);
  });

  it('id が一意（同じ形を2つのレベルに入れない）', () => {
    const ids = CHORDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('同じレベルに同じ名前のコードがない', () => {
    for (const level of LEVELS) {
      const names = chordsOfLevel(level).map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('すべてのレベルに説明がある', () => {
    for (const level of LEVELS) expect(LEVEL_INFO[level].title).not.toBe('');
  });

  it('早見表の形から指定したポジションを選ぶ', () => {
    expect(byLevelAndName(2, 'F').frets).toEqual([1, 3, 3, 2, 1, 1]);
    expect(byLevelAndName(3, 'B7').frets).toEqual([null, 2, 1, 2, 0, 2]);
    expect(byLevelAndName(2, 'E♭').frets).toEqual([null, 6, 8, 8, 8, 6]);
    expect(byLevelAndName(6, 'Gadd9').frets).toEqual([3, 2, 0, 2, 0, 3]);
    expect(byLevelAndName(4, 'FM7').frets).toEqual([1, null, 2, 2, 1, null]);
    expect(byLevelAndName(5, 'C7').frets).toEqual([null, 3, 5, 3, 5, 3]);
    expect(byLevelAndName(5, 'E7').frets).toEqual([null, 7, 9, 7, 9, 7]);
    expect(byLevelAndName(9, 'F').frets).toEqual([null, null, 3, 2, 1, 1]);
  });

  describe.each(CHORDS)('$id', (chord) => {
    const expected = expectedTones(chord.id.split('@')[0]);

    it('frets と fingers が6弦分ある', () => {
      expect(chord.frets).toHaveLength(6);
      if (chord.fingers) expect(chord.fingers).toHaveLength(6);
    });

    it('ルートが一番低い弦で鳴っている', () => {
      expect(rootNote(chord)).toBe(expected.root);
    });

    it('構成音がコード名と一致する（完全5度は省略可）', () => {
      const tones = chordTones(chord);
      for (const tone of tones) expect([...expected.required, ...expected.optional]).toContain(tone);
      for (const tone of expected.required) expect(tones).toContain(tone);
    });
  });
});
