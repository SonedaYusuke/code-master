import { NOTES, type Note } from '../model';

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
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  m7b5: [0, 3, 6, 10],
  '9': [0, 4, 7, 10, 2],
};

const PERFECT_FIFTH = 7;

/** テスト用: id（例: "F#m7", "Bb"）から期待されるルートと構成音を求める。完全5度は省略可として分けて返す */
export function expectedTones(id: string): { root: Note; required: Note[]; optional: Note[] } {
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
