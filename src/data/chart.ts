import { NOTES, type ChordShape, type Note } from '../model';
import { chordTones, sortFromRoot } from '../lib/notes';

/** 各ルートの中での並び順 */
export const CHART_TYPES = ['', 'm', '7', 'm7', 'maj7', 'sus4', 'add9'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  '': 'M',
  m: 'm',
  '7': '7',
  m7: 'm7',
  maj7: 'M7',
  sus4: 'sus4',
  add9: 'add9',
};

export type VoicingLabel = 'オープン' | '6弦ルート' | '5弦ルート' | '4弦ルート';
export type Voicing = ChordShape & { label: VoicingLabel };
export type ChartChord = { id: string; name: string; type: ChartType; tones: Note[]; voicings: Voicing[] };
export type ChartSection = { root: Note; chords: ChartChord[] };

/** ルートを 0 フレットとしたときの相対フレット。指 1 が人差し指のセーハ */
type MovableShape = {
  frets: (number | null)[];
  fingers: (number | null)[];
  barre?: { fromString: number; toString: number };
};

type MovableFamily = {
  label: VoicingLabel;
  /** ルートを鳴らす弦の開放音 */
  openNote: Note;
  shapes: Partial<Record<ChartType, MovableShape>>;
};

const FAMILIES: MovableFamily[] = [
  {
    label: '6弦ルート',
    openNote: 'E',
    shapes: {
      '': { frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
      m: { frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
      '7': { frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
      m7: { frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
      maj7: { frets: [0, null, 1, 1, 0, null], fingers: [1, null, 3, 4, 2, null] },
      sus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: { fromString: 6, toString: 1 } },
      add9: { frets: [0, 2, 4, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
    },
  },
  {
    label: '5弦ルート',
    openNote: 'A',
    shapes: {
      '': { frets: [null, 0, 2, 2, 2, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
      m: { frets: [null, 0, 2, 2, 1, 0], fingers: [null, 1, 3, 4, 2, 1], barre: { fromString: 5, toString: 1 } },
      '7': { frets: [null, 0, 2, 0, 2, 0], fingers: [null, 1, 3, 1, 4, 1], barre: { fromString: 5, toString: 1 } },
      m7: { frets: [null, 0, 2, 0, 1, 0], fingers: [null, 1, 3, 1, 2, 1], barre: { fromString: 5, toString: 1 } },
      maj7: { frets: [null, 0, 2, 1, 2, 0], fingers: [null, 1, 3, 2, 4, 1], barre: { fromString: 5, toString: 1 } },
      sus4: { frets: [null, 0, 2, 2, 3, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
      add9: { frets: [null, 0, 2, 4, 2, 0], fingers: [null, 1, 2, 4, 3, 1], barre: { fromString: 5, toString: 1 } },
    },
  },
  {
    // add9 は5フレット以内に収まる形がないので載せない
    label: '4弦ルート',
    openNote: 'D',
    shapes: {
      '': { frets: [null, null, 0, 2, 3, 2], fingers: [null, null, 1, 2, 4, 3] },
      m: { frets: [null, null, 0, 2, 3, 1], fingers: [null, null, 1, 3, 4, 2] },
      '7': { frets: [null, null, 0, 2, 1, 2], fingers: [null, null, 1, 3, 2, 4] },
      m7: { frets: [null, null, 0, 2, 1, 1], fingers: [null, null, 1, 3, 2, 2] },
      maj7: { frets: [null, null, 0, 2, 2, 2], fingers: [null, null, 1, 2, 3, 4] },
      sus4: { frets: [null, null, 0, 2, 3, 3], fingers: [null, null, 1, 2, 3, 4] },
    },
  },
];

/** 移動形とは別に載せる、定番の開放弦の形 */
const OPEN_SHAPES: Record<string, Pick<ChordShape, 'frets' | 'fingers'>> = {
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

type Fingering = Omit<ChordShape, 'id' | 'name'>;

function transpose(shape: MovableShape, rootFret: number): Fingering {
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

/** 並び順の基準: 開放弦の形は 0、それ以外は押さえる一番低いフレット */
function position(voicing: Voicing): number {
  if (voicing.label === 'オープン') return 0;
  return Math.min(...voicing.frets.filter((f): f is number => f !== null && f > 0));
}

function buildChord(root: Note, type: ChartType): ChartChord {
  const id = `${root}${type}`;
  const toVoicing = (label: VoicingLabel, fingering: Fingering): Voicing => ({ id: `${id}@${label}`, name: id, label, ...fingering });

  const candidates: Voicing[] = [];
  const open = OPEN_SHAPES[id];
  if (open) candidates.push(toVoicing('オープン', open));
  for (const family of FAMILIES) {
    const shape = family.shapes[type];
    if (!shape) continue;
    const rootFret = (NOTES.indexOf(root) - NOTES.indexOf(family.openNote) + 12) % 12;
    candidates.push(toVoicing(rootFret === 0 ? 'オープン' : family.label, transpose(shape, rootFret)));
  }

  const seen = new Set<string>();
  const voicings = candidates
    .filter((v) => {
      const key = JSON.stringify(v.frets);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => position(a) - position(b));

  return { id, name: id, type, tones: sortFromRoot(root, voicings.flatMap(chordTones)), voicings };
}

export const CHART: ChartSection[] = NOTES.map((root) => ({
  root,
  chords: CHART_TYPES.map((type) => buildChord(root, type)),
}));
