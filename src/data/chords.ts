import type { Chord, Level } from '../model';

export const LEVEL_INFO: Record<Level, { title: string; description: string }> = {
  1: { title: '必須コード', description: 'まず最初に覚えたい基本のコード。F と B のバレーもここで挑戦します。' },
  2: { title: 'オープンの7th', description: '開放弦を使ったセブンスコード。ブルースやポップスでよく登場します。' },
  3: { title: 'バレーコード（基本）', description: '6弦・5弦ルートのバレーで、いろいろなキーのメジャー・マイナーを押さえます。' },
  4: { title: 'バレーの7th系・sus', description: 'maj7・m7 と sus2 / sus4。響きに色をつけるコードです。' },
  5: { title: 'テンション・応用', description: 'add9・6・dim・aug・m7♭5・9th。知っておくと表現の幅が広がります。' },
};

export const CHORDS: Chord[] = [
  // Lv1
  { id: 'C', name: 'C', level: 1, frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { id: 'G', name: 'G', level: 1, frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4] },
  { id: 'D', name: 'D', level: 1, frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { id: 'A', name: 'A', level: 1, frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { id: 'E', name: 'E', level: 1, frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { id: 'Am', name: 'Am', level: 1, frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { id: 'Em', name: 'Em', level: 1, frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { id: 'Dm', name: 'Dm', level: 1, frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  {
    id: 'B', name: 'B', level: 1,
    frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'F', name: 'F', level: 1,
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1 },
  },

  // Lv2
  { id: 'A7', name: 'A7', level: 2, frets: [null, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { id: 'D7', name: 'D7', level: 2, frets: [null, null, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { id: 'E7', name: 'E7', level: 2, frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { id: 'G7', name: 'G7', level: 2, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { id: 'C7', name: 'C7', level: 2, frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { id: 'B7', name: 'B7', level: 2, frets: [null, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
  { id: 'Am7', name: 'Am7', level: 2, frets: [null, 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  { id: 'Em7', name: 'Em7', level: 2, frets: [0, 2, 0, 0, 0, 0], fingers: [null, 2, null, null, null, null] },
  { id: 'Dm7', name: 'Dm7', level: 2, frets: [null, null, 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1] },

  // Lv3
  {
    id: 'Bm', name: 'Bm', level: 3,
    frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'Bb', name: 'B♭', level: 3,
    frets: [null, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1 },
  },
  {
    id: 'F#m', name: 'F#m', level: 3,
    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1 },
  },
  {
    id: 'Cm', name: 'Cm', level: 3,
    frets: [null, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 5, toString: 1 },
  },
  {
    id: 'Gm', name: 'Gm', level: 3,
    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 3, fromString: 6, toString: 1 },
  },

  // Lv4
  { id: 'Fmaj7', name: 'Fmaj7', level: 4, frets: [null, null, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] },
  { id: 'Cmaj7', name: 'Cmaj7', level: 4, frets: [null, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  {
    id: 'Bm7', name: 'Bm7', level: 4,
    frets: [null, 2, 4, 2, 3, 2], fingers: [null, 1, 3, 1, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1 },
  },
  {
    id: 'F#m7', name: 'F#m7', level: 4,
    frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1 },
  },
  { id: 'Asus4', name: 'Asus4', level: 4, frets: [null, 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  { id: 'Dsus4', name: 'Dsus4', level: 4, frets: [null, null, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  { id: 'Esus4', name: 'Esus4', level: 4, frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },
  { id: 'Asus2', name: 'Asus2', level: 4, frets: [null, 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  { id: 'Dsus2', name: 'Dsus2', level: 4, frets: [null, null, 0, 2, 3, 0], fingers: [null, null, null, 1, 3, null] },

  // Lv5
  { id: 'Cadd9', name: 'Cadd9', level: 5, frets: [null, 3, 2, 0, 3, 0], fingers: [null, 2, 1, null, 3, null] },
  { id: 'C6', name: 'C6', level: 5, frets: [null, 3, 2, 2, 1, 0], fingers: [null, 4, 2, 3, 1, null] },
  { id: 'Bdim', name: 'Bdim', level: 5, frets: [null, 2, 3, 4, 3, null], fingers: [null, 1, 2, 4, 3, null] },
  { id: 'Caug', name: 'Caug', level: 5, frets: [null, 3, 2, 1, 1, 0], fingers: [null, 4, 3, 1, 2, null] },
  { id: 'Bm7b5', name: 'Bm7♭5', level: 5, frets: [null, 2, 3, 2, 3, null], fingers: [null, 1, 3, 2, 4, null] },
  { id: 'E9', name: 'E9', level: 5, frets: [0, 2, 0, 1, 0, 2], fingers: [null, 2, null, 1, null, 3] },
];

export function chordsOfLevel(level: Level): Chord[] {
  return CHORDS.filter((chord) => chord.level === level);
}
