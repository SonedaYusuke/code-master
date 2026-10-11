import type { Note } from '../model';
import { CHART, type ChartType, type Voicing } from '../data/chart';

export const MAX_LIVES = 3;
export const MAX_QUESTIONS = 100;
const CHOICE_COUNT = 4;

export type ChallengeItem = { chordId: string; name: string; type: ChartType; root: Note; voicing: Voicing };
export type ChallengeQuestion = { item: ChallengeItem; choices: string[] };

/** これ以上のフレットから始まる形は、実際の演奏ではあまり使わないので省く */
const HIGH_POSITION_FRET = 10;
/** 4弦ルートの形を残すタイプ。それ以外は押さえにくいか、ほとんど使わない */
const FOURTH_STRING_TYPES: ReadonlySet<ChartType> = new Set<ChartType>(['', 'm', '7']);

function lowestFret(voicing: Voicing): number {
  const fretted = voicing.frets.filter((f): f is number => f !== null && f > 0);
  return voicing.label === 'オープン' || fretted.length === 0 ? 0 : Math.min(...fretted);
}

function isPlayable(type: ChartType, voicing: Voicing): boolean {
  if (lowestFret(voicing) >= HIGH_POSITION_FRET) return false;
  if (voicing.label === '4弦ルート' && !FOURTH_STRING_TYPES.has(type)) return false;
  // 6弦ルートの add9 は4フレットに広げる、かなり苦しい形
  if (voicing.label === '6弦ルート' && type === 'add9') return false;
  return true;
}

const ALL_CHORDS = CHART.flatMap((section) => section.chords.map((chord) => ({ ...chord, root: section.root })));

export function buildPool(types: ReadonlySet<ChartType>): ChallengeItem[] {
  return ALL_CHORDS.filter((chord) => types.has(chord.type)).flatMap((chord) =>
    chord.voicings
      .filter((voicing) => isPlayable(chord.type, voicing))
      .map((voicing) => ({ chordId: chord.id, name: chord.name, type: chord.type, root: chord.root, voicing })),
  );
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 同じタイプでルート違い、または同じルートでタイプ違いのコード名を混ぜる */
function buildChoices(item: ChallengeItem, rng: () => number): string[] {
  const related = ALL_CHORDS.filter(
    (chord) => chord.id !== item.chordId && (chord.type === item.type || chord.root === item.root),
  );
  const names = new Set([item.name]);
  for (const chord of shuffle(related, rng)) {
    if (names.size === CHOICE_COUNT) break;
    names.add(chord.name);
  }
  return shuffle([...names], rng);
}

/** 前の問題と同じ形は避けて、ランダムに1問作る */
export function nextQuestion(
  pool: readonly ChallengeItem[],
  previous: ChallengeItem | null,
  rng: () => number = Math.random,
): ChallengeQuestion {
  if (pool.length === 0) throw new Error('出題できる形がありません');
  const candidates = pool.length > 1 && previous ? pool.filter((item) => item.voicing.id !== previous.voicing.id) : pool;
  const item = candidates[Math.floor(rng() * candidates.length)];
  return { item, choices: buildChoices(item, rng) };
}

/** answered は回答済みの問題数 */
export function isFinished(lives: number, answered: number): boolean {
  return lives <= 0 || answered >= MAX_QUESTIONS;
}
