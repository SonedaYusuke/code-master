import { NOTES, type Chord, type Note } from '../model';
import { CHART_TYPES, type ChartType } from '../data/chart';

const CHOICE_COUNT = 4;
/** 正解のルートから半音・全音ずれた音を、まぎらわしい選択肢にする */
const ROOT_OFFSETS = [-2, -1, 1, 2];
const FLAT_NAMES: Partial<Record<Note, string>> = { 'C#': 'D♭', 'D#': 'E♭', 'F#': 'G♭', 'G#': 'A♭', 'A#': 'B♭' };

export type BuildTarget = { root: Note; type: ChartType; preferFlat: boolean };
export type BuildQuestion = BuildTarget & { rootChoices: Note[]; typeChoices: ChartType[] };

/** 早見表の id（例: "F#m7b5"）をルートとタイプに分ける */
export function parseChordId(chordId: string): { root: Note; type: ChartType } {
  const match = chordId.match(/^([A-G]#?)(.*)$/);
  const type = match?.[2] as ChartType | undefined;
  if (!match || type === undefined || !CHART_TYPES.includes(type)) throw new Error(`id を解釈できません: ${chordId}`);
  return { root: match[1] as Note, type };
}

/** レベルのコード（id は "早見表のid@形のラベル"）から出題に使う情報を取り出す */
export function rootAndType(chord: Chord): BuildTarget {
  return { ...parseChordId(chord.id.split('@')[0]), preferFlat: /^[A-G]♭/.test(chord.name) };
}

export function displayRoot(note: Note, preferFlat: boolean): string {
  return (preferFlat && FLAT_NAMES[note]) || note;
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function rootChoices(root: Note, rng: () => number): Note[] {
  const index = NOTES.indexOf(root);
  const nearby = shuffle(ROOT_OFFSETS, rng)
    .slice(0, CHOICE_COUNT - 1)
    .map((offset) => NOTES[(index + offset + 12) % 12]);
  return shuffle([root, ...nearby], rng);
}

/** 出題範囲のタイプを優先し、足りなければ並び順の近いタイプで補う */
function typeChoices(type: ChartType, poolTypes: readonly ChartType[], rng: () => number): ChartType[] {
  const fromPool = shuffle(poolTypes.filter((t) => t !== type), rng);
  const order = CHART_TYPES.indexOf(type);
  const nearby = CHART_TYPES.filter((t) => t !== type && !poolTypes.includes(t)).sort(
    (a, b) => Math.abs(CHART_TYPES.indexOf(a) - order) - Math.abs(CHART_TYPES.indexOf(b) - order),
  );
  return shuffle([type, ...[...fromPool, ...nearby].slice(0, CHOICE_COUNT - 1)], rng);
}

export function buildQuestion(
  target: BuildTarget,
  poolTypes: readonly ChartType[],
  rng: () => number = Math.random,
): BuildQuestion {
  return { ...target, rootChoices: rootChoices(target.root, rng), typeChoices: typeChoices(target.type, poolTypes, rng) };
}
