import { describe, expect, it } from 'vitest';
import { NOTES } from '../model';
import { chordTones, rootNote } from '../lib/notes';
import { CHART, CHART_TYPES, FREQUENCIES } from './chart';
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

  it('タイプは よく使う7種 → m7♭5 → dim → dim7 → aug → 6 → sus2 → 9 の14種', () => {
    expect([...CHART_TYPES]).toEqual(['', 'm', '7', 'm7', 'maj7', 'sus4', 'add9', 'm7b5', 'dim', 'dim7', 'aug', '6', 'sus2', '9']);
  });

  it('表示名は maj7 を M7、m7b5 を m7♭5 と書く', () => {
    expect(byId('Cmaj7').name).toBe('CM7');
    expect(byId('Cm7b5').name).toBe('Cm7♭5');
    expect(byId('C#dim7').name).toBe('C#dim7');
  });

  it('ルートより低いフレットを使う形が0フレットを下回るときは1オクターブ上に移す', () => {
    // E の6弦ルート dim7（3x232x 型）は 0 フレットだと -1 になるので 12 フレットへ
    expect(voicing('Edim7', '6弦ルート')).toMatchObject({ frets: [12, null, 11, 12, 11, null], baseFret: 11 });
    // G は 3 フレットなのでそのまま
    expect(voicing('Gdim7', '6弦ルート')).toMatchObject({ frets: [3, null, 2, 3, 2, null] });
    expect(voicing('Gdim7', '6弦ルート')!.baseFret).toBeUndefined();
  });

  it('各ルートにタイプ順でコードが並ぶ', () => {
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

  it('頻出度の一覧のコードはすべて早見表にあり、重複しない', () => {
    const listed = [...FREQUENCIES.top, ...FREQUENCIES.common];
    for (const id of listed) expect(allChords.map((c) => c.id)).toContain(id);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('超頻出コードは一番低い形が超頻出、7フレット以内の6弦・5弦ルートの形が頻出', () => {
    expect(voicing('C', 'オープン')!.frequency).toBe('top');
    expect(voicing('C', '5弦ルート')!.frequency).toBe('common');
    expect(voicing('C', '6弦ルート')!.frequency).toBeUndefined(); // 8フレット
    expect(voicing('C', '4弦ルート')!.frequency).toBeUndefined();
    expect(voicing('G', '6弦ルート')!.frequency).toBe('common');
    expect(voicing('F', '6弦ルート')!.frequency).toBe('top');
    expect(voicing('Bm', '5弦ルート')!.frequency).toBe('top');
    expect(voicing('A#', '5弦ルート')!.frequency).toBe('top');
    expect(voicing('F', '省略形')!.frequency).toBe('common');
  });

  it('省略形は同じポジションのバレーの形の後ろに並ぶ', () => {
    expect(labelsOf('F')).toEqual(['6弦ルート', '省略形', '4弦ルート', '5弦ルート']);
    expect(voicing('F', '省略形')).toMatchObject({ frets: [null, null, 3, 2, 1, 1] });
  });

  it('m7 の省略形を全ルートに載せる（ルートが開放弦になる位置は除く）', () => {
    const simplifiedFrets = (id: string) => byId(id).voicings.filter((v) => v.label === '省略形').map((v) => v.frets);
    expect(simplifiedFrets('F#m7')).toContainEqual([2, null, 2, 2, 2, null]);
    expect(simplifiedFrets('Bm7')).toEqual([[null, 2, 0, 2, 0, 2], [7, null, 7, 7, 7, null]]);
    expect(simplifiedFrets('Em7')).not.toContainEqual([0, null, 0, 0, 0, null]);
    for (const { root } of CHART) {
      if (root !== 'E') expect(simplifiedFrets(`${root}m7`)).not.toHaveLength(0);
    }
  });

  it('頻出コードは一番低い形と省略形が頻出', () => {
    expect(byId('F#m').voicings.map((v) => v.frequency)).toEqual(['common', 'common', undefined, undefined]);
    expect(voicing('Cadd9', 'オープン')!.frequency).toBe('common');
  });

  it('一覧にないコードの形にはラベルを付けない', () => {
    expect(byId('Cdim').voicings.every((v) => v.frequency === undefined)).toBe(true);
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

    it('超頻出の形は最大1つ', () => {
      expect(chord.voicings.filter((v) => v.frequency === 'top').length).toBeLessThanOrEqual(1);
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
