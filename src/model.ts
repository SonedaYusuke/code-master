export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type Note = (typeof NOTES)[number];

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(n: number): n is Level {
  return (LEVELS as readonly number[]).includes(n);
}

/** 押さえ方。早見表のコードはレベルを持たない */
export type ChordShape = {
  /** 一意キー。例: "C", "Am", "F#m7", "Bb" */
  id: string;
  /** 表示名。例: "B♭" */
  name: string;
  /** 6弦→1弦の順、長さ6。null=ミュート, 0=開放 */
  frets: (number | null)[];
  /** 指番号（1〜4）。6弦→1弦の順 */
  fingers?: (number | null)[];
  /** 弦番号は 6〜1。fromString が低音側 */
  barre?: { fret: number; fromString: number; toString: number };
  /** ダイアグラムの表示開始フレット。省略時は 1 */
  baseFret?: number;
};

/** 学習・クイズ用のコード。simplified は省略形の押さえ方 */
export type Chord = ChordShape & { level: Level; simplified?: true };
