import { describe, expect, it } from 'vitest';
import { NOTES } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHART, CHART_TYPES } from './chart';
import { expectedTones } from './expectedTones';

const allChords = CHART.flatMap((section) => section.chords);
const byId = (id: string) => allChords.find((c) => c.id === id)!;

describe('CHART', () => {
  it('ルートが C から B まで半音順に並ぶ', () => {
    expect(CHART.map((s) => s.root)).toEqual([...NOTES]);
  });

  it('各ルートに メジャー → m → 7 → m7 → maj7 → sus4 → add9 の順で7コードある', () => {
    for (const section of CHART) {
      expect(section.chords.map((c) => c.id)).toEqual(CHART_TYPES.map((type) => `${section.root}${type}`));
    }
  });

  it('定番のオープンコードは開放弦の形を使う', () => {
    expect(byId('C').frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(byId('G').frets).toEqual([3, 2, 0, 0, 0, 3]);
    expect(byId('D').frets).toEqual([null, null, 0, 2, 3, 2]);
  });

  it('E と A がルートのコードは、移動形から開放弦の形になる', () => {
    expect(byId('E')).toMatchObject({ frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] });
    expect(byId('Am')).toMatchObject({ frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] });
    expect(byId('E').barre).toBeUndefined();
  });

  it('それ以外は低いほうのバレーの形にずらす', () => {
    // F#: 6弦ルート2フレット
    expect(byId('F#')).toMatchObject({ frets: [2, 4, 4, 3, 2, 2], barre: { fret: 2, fromString: 6, toString: 1 } });
    // D#: 5弦ルート6フレット（6弦ルートなら11フレット）
    expect(byId('D#')).toMatchObject({ frets: [null, 6, 8, 8, 8, 6], baseFret: 6 });
  });

  describe.each(allChords)('$id', (chord) => {
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
