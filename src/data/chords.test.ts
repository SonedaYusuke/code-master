import { describe, expect, it } from 'vitest';
import { LEVELS, NOTES, type Level, type Note } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from './chords';

const QUALITY_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  add9: [0, 4, 7, 2],
  '6': [0, 4, 7, 9],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  m7b5: [0, 3, 6, 10],
  '9': [0, 4, 7, 10, 2],
};

const PERFECT_FIFTH = 7;

/** id（例: "F#m7", "Bb"）から期待されるルートと構成音を求める。完全5度は省略可として分けて返す */
function expectedTones(id: string): { root: Note; required: Note[]; optional: Note[] } {
  const match = id.match(/^([A-G])(#|b)?(.*)$/);
  if (!match) throw new Error(`id を解釈できません: ${id}`);
  const [, letter, accidental, quality] = match;
  const intervals = QUALITY_INTERVALS[quality];
  if (!intervals) throw new Error(`未知のコードタイプ: ${quality}`);
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const rootIndex = (NOTES.indexOf(letter as Note) + offset + 12) % 12;
  const toNote = (interval: number) => NOTES[(rootIndex + interval) % 12];
  return {
    root: NOTES[rootIndex],
    required: intervals.filter((i) => i !== PERFECT_FIFTH).map(toNote),
    optional: intervals.filter((i) => i === PERFECT_FIFTH).map(toNote),
  };
}

const EXPECTED_IDS: Record<Level, string[]> = {
  1: ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'B', 'F'],
  2: ['A7', 'D7', 'E7', 'G7', 'C7', 'B7', 'Am7', 'Em7', 'Dm7'],
  3: ['Bm', 'Bb', 'F#m', 'Cm', 'Gm'],
  4: ['Fmaj7', 'Cmaj7', 'Bm7', 'F#m7', 'Asus4', 'Dsus4', 'Esus4', 'Asus2', 'Dsus2'],
  5: ['Cadd9', 'C6', 'Bdim', 'Caug', 'Bm7b5', 'E9'],
};

describe('CHORDS', () => {
  it.each(LEVELS)('Lv%i に spec どおりのコードが入っている', (level) => {
    expect(chordsOfLevel(level).map((c) => c.id)).toEqual(EXPECTED_IDS[level]);
  });

  it('id が一意', () => {
    const ids = CHORDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('すべてのレベルに説明がある', () => {
    for (const level of LEVELS) expect(LEVEL_INFO[level].title).not.toBe('');
  });

  describe.each(CHORDS)('$id', (chord) => {
    const expected = expectedTones(chord.id);

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

    it('表示範囲（baseFret から5フレット）に収まっている', () => {
      const base = chord.baseFret ?? 1;
      for (const fret of chord.frets) {
        if (fret !== null && fret > 0) {
          expect(fret).toBeGreaterThanOrEqual(base);
          expect(fret).toBeLessThan(base + 5);
        }
      }
    });
  });
});
