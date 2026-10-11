import { describe, expect, it } from 'vitest';
import { NOTES } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHART, CHART_TYPES } from './chart';
import { expectedTones } from './expectedTones';

const allChords = CHART.flatMap((section) => section.chords);
const byId = (id: string) => allChords.find((c) => c.id === id)!;
const labelsOf = (id: string) => byId(id).voicings.map((v) => v.label);
const voicing = (id: string, label: string) => byId(id).voicings.find((v) => v.label === label);
/** 一番低い鳴っている弦の番号（6〜1） */
const rootString = (frets: (number | null)[]) => 6 - frets.findIndex((f) => f !== null);
/** 並び順の基準: 開放弦の形は 0、それ以外は押さえる一番低いフレット */
const position = (v: { label: string; frets: (number | null)[] }) =>
  v.label === 'オープン' ? 0 : Math.min(...v.frets.filter((f): f is number => f !== null && f > 0));

describe('CHART', () => {
  it('ルートが C から B まで半音順に並ぶ', () => {
    expect(CHART.map((s) => s.root)).toEqual([...NOTES]);
  });

  it('各ルートに メジャー → m → 7 → m7 → maj7 → sus4 → add9 の順で7コードある', () => {
    for (const section of CHART) {
      expect(section.chords.map((c) => c.id)).toEqual(CHART_TYPES.map((type) => `${section.root}${type}`));
    }
  });

  it('C はオープン・5弦ルート・6弦ルート・4弦ルートを低いポジション順に持つ', () => {
    expect(byId('C').voicings.map((v) => [v.label, v.frets])).toEqual([
      ['オープン', [null, 3, 2, 0, 1, 0]],
      ['5弦ルート', [null, 3, 5, 5, 5, 3]],
      ['6弦ルート', [8, 10, 10, 9, 8, 8]],
      ['4弦ルート', [null, null, 10, 12, 13, 12]],
    ]);
  });

  it('0フレットの移動形は開放弦の形になり、指番号を繰り上げる', () => {
    expect(voicing('E', 'オープン')).toMatchObject({ frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] });
    expect(voicing('E', 'オープン')!.barre).toBeUndefined();
    expect(voicing('Am', 'オープン')).toMatchObject({ frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] });
  });

  it('オープンと同じ形の移動形は1つにまとめる', () => {
    // D の4弦ルート0フレット = オープンの D
    expect(labelsOf('D')).toEqual(['オープン', '5弦ルート', '6弦ルート']);
  });

  it('4弦ルートの add9 は載せない', () => {
    for (const section of CHART) expect(labelsOf(`${section.root}add9`)).not.toContain('4弦ルート');
  });

  it('高いポジションは開始フレットを表示する', () => {
    expect(voicing('D#', '5弦ルート')).toMatchObject({ frets: [null, 6, 8, 8, 8, 6], baseFret: 6 });
    expect(voicing('F#', '6弦ルート')).toMatchObject({ frets: [2, 4, 4, 3, 2, 2], barre: { fret: 2, fromString: 6, toString: 1 } });
    expect(voicing('F#', '6弦ルート')!.baseFret).toBeUndefined();
  });

  it('構成音は全ボイシングの音を合わせて、ルートから並べる', () => {
    // C7 のオープンは5度（G）を省くが、他の形で鳴っている
    expect(byId('C7').tones).toEqual(['C', 'E', 'G', 'A#']);
  });

  describe.each(allChords)('$id', (chord) => {
    const expected = expectedTones(chord.id);

    it('6弦・5弦ルートの形があり（add9 以外は4弦ルートも）、重複がない', () => {
      const strings = chord.voicings.map((v) => rootString(v.frets));
      expect(strings).toContain(6);
      expect(strings).toContain(5);
      if (!chord.id.endsWith('add9')) expect(strings).toContain(4);
      const keys = chord.voicings.map((v) => JSON.stringify(v.frets));
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('低いポジション順に並んでいる', () => {
      const positions = chord.voicings.map(position);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it('構成音がコード名と一致する', () => {
      expect(new Set(chord.tones)).toEqual(new Set([...expected.required, ...expected.optional]));
    });

    describe.each(chord.voicings)('$label', (v) => {
      it('frets と fingers が6弦分ある', () => {
        expect(v.frets).toHaveLength(6);
        if (v.fingers) expect(v.fingers).toHaveLength(6);
      });

      it('ルートが一番低い弦で鳴っている', () => {
        expect(rootNote(v)).toBe(expected.root);
      });

      it('構成音がコード名と一致する（完全5度は省略可）', () => {
        const tones = chordTones(v);
        for (const tone of tones) expect([...expected.required, ...expected.optional]).toContain(tone);
        for (const tone of expected.required) expect(tones).toContain(tone);
      });

      it('表示範囲（baseFret から5フレット）に収まっている', () => {
        const base = v.baseFret ?? 1;
        for (const fret of v.frets) {
          if (fret !== null && fret > 0) {
            expect(fret).toBeGreaterThanOrEqual(base);
            expect(fret).toBeLessThan(base + 5);
          }
        }
      });
    });
  });
});
