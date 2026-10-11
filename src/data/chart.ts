import { NOTES, type ChordShape, type Note } from '../model';

/** 各ルートの中での並び順 */
export const CHART_TYPES = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'add9'] as const;
type ChartType = (typeof CHART_TYPES)[number];

export type ChartSection = { root: Note; chords: ChordShape[] };

/** ルートを 0 フレットとしたときの相対フレット。指 1 が人差し指のセーハ */
type MovableShape = {
  frets: (number | null)[];
  fingers: (number | null)[];
  barre?: { fromString: number; toString: number };
};

/** 6弦ルートの形（E型） */
const E_SHAPES: Record<ChartType, MovableShape> = {
  '': { frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
  m: { frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
  '7': { frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
  m7: { frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
  maj7: { frets: [0, null, 1, 1, 0, null], fingers: [1, null, 3, 4, 2, null] },
  sus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: { fromString: 6, toString: 1 } },
  add9: { frets: [0, 2, 4, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
};

/** 5弦ルートの形（A型） */
const A_SHAPES: Record<ChartType, MovableShape> = {
  '': { frets: [null, 0, 2, 2, 2, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
  m: { frets: [null, 0, 2, 2, 1, 0], fingers: [null, 1, 3, 4, 2, 1], barre: { fromString: 5, toString: 1 } },
  '7': { frets: [null, 0, 2, 0, 2, 0], fingers: [null, 1, 3, 1, 4, 1], barre: { fromString: 5, toString: 1 } },
  m7: { frets: [null, 0, 2, 0, 1, 0], fingers: [null, 1, 3, 1, 2, 1], barre: { fromString: 5, toString: 1 } },
  maj7: { frets: [null, 0, 2, 1, 2, 0], fingers: [null, 1, 3, 2, 4, 1], barre: { fromString: 5, toString: 1 } },
  sus4: { frets: [null, 0, 2, 2, 3, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
  add9: { frets: [null, 0, 2, 4, 2, 0], fingers: [null, 1, 2, 4, 3, 1], barre: { fromString: 5, toString: 1 } },
};

/** 移動形より定番の開放弦の形を優先するコード */
const OPEN_OVERRIDES: Record<string, Pick<ChordShape, 'frets' | 'fingers'>> = {
  C: { frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  C7: { frets: [null, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  Cmaj7: { frets: [null, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  Csus4: { frets: [null, 3, 3, 0, 1, 1], fingers: [null, 3, 4, null, 1, 1] },
  Cadd9: { frets: [null, 3, 2, 0, 3, 0], fingers: [null, 2, 1, null, 3, null] },
  D: { frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  Dm: { frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  D7: { frets: [null, null, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  Dm7: { frets: [null, null, 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1] },
  Dmaj7: { frets: [null, null, 0, 2, 2, 2], fingers: [null, null, null, 1, 2, 3] },
  Dsus4: { frets: [null, null, 0, 2, 3, 3], fingers: [null, null, null, 1, 2, 3] },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, null, null, null, 1] },
};

const MAX_FRET_WITHOUT_OFFSET = 5;

function transpose(shape: MovableShape, rootFret: number): Omit<ChordShape, 'id' | 'name'> {
  const frets = shape.frets.map((f) => (f === null ? null : f + rootFret));
  if (rootFret === 0) {
    // 開放弦がセーハの代わりになるので、人差し指を外して指番号を1つずつ繰り上げる
    const fingers = shape.frets.map((f, i) => (f === null || f === 0 ? null : shape.fingers[i]! - 1));
    return { frets, fingers };
  }
  const maxFret = Math.max(...frets.filter((f): f is number => f !== null));
  return {
    frets,
    fingers: shape.fingers,
    ...(shape.barre && { barre: { fret: rootFret, ...shape.barre } }),
    ...(maxFret > MAX_FRET_WITHOUT_OFFSET && { baseFret: rootFret }),
  };
}

function buildChord(root: Note, type: ChartType): ChordShape {
  const id = `${root}${type}`;
  const override = OPEN_OVERRIDES[id];
  if (override) return { id, name: id, ...override };
  const rootIndex = NOTES.indexOf(root);
  const eFret = (rootIndex - NOTES.indexOf('E') + 12) % 12;
  const aFret = (rootIndex - NOTES.indexOf('A') + 12) % 12;
  const shape = eFret <= aFret ? transpose(E_SHAPES[type], eFret) : transpose(A_SHAPES[type], aFret);
  return { id, name: id, ...shape };
}

export const CHART: ChartSection[] = NOTES.map((root) => ({
  root,
  chords: CHART_TYPES.map((type) => buildChord(root, type)),
}));
