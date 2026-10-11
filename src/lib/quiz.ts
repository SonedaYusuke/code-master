import type { Chord, Level } from '../model';

export const QUESTION_COUNT = 10;
export const CHOICE_COUNT = 4;

/** choice: コード名の4択 / build: ルート4択 → タイプ4択 / shape: コード名から形の4択 */
export type QuizMode = 'choice' | 'build' | 'shape';

export const MODE_LABELS: Record<QuizMode, string> = { choice: '4択', build: 'ルート＋タイプ', shape: '形を選ぶ' };

export type Question = { answer: Chord; choices: Chord[] };

export type QuizResult = {
  level: Level;
  mode: QuizMode;
  /** 正答率（%） */
  score: number;
  points: number;
  maxCombo: number;
  newHighScore: boolean;
  correct: number;
  total: number;
  wrong: Chord[];
};

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 全コードを一巡させてから重複を許して QUESTION_COUNT 個そろえる */
function pickAnswers(levelChords: readonly Chord[], rng: () => number): Chord[] {
  const answers: Chord[] = [];
  while (answers.length < QUESTION_COUNT) answers.push(...shuffle(levelChords, rng));
  return answers.slice(0, QUESTION_COUNT);
}

function buildChoices(
  answer: Chord,
  levelChords: readonly Chord[],
  allChords: readonly Chord[],
  rng: () => number,
): Chord[] {
  const levelIds = new Set(levelChords.map((c) => c.id));
  const sameLevel = shuffle(levelChords.filter((c) => c.id !== answer.id), rng);
  const others = shuffle(allChords.filter((c) => !levelIds.has(c.id)), rng);
  // 別のレベルに同じ名前の形（例: Lv3 と Lv5 の C7）があるので、名前が重ならないものだけ選ぶ
  const names = new Set([answer.name]);
  const distractors: Chord[] = [];
  for (const chord of [...sameLevel, ...others]) {
    if (distractors.length === CHOICE_COUNT - 1) break;
    if (names.has(chord.name)) continue;
    names.add(chord.name);
    distractors.push(chord);
  }
  return shuffle([answer, ...distractors], rng);
}

export function generateQuiz(
  levelChords: readonly Chord[],
  allChords: readonly Chord[],
  rng: () => number = Math.random,
): Question[] {
  if (levelChords.length === 0) throw new Error('出題できるコードがありません');
  return pickAnswers(levelChords, rng).map((answer) => ({
    answer,
    choices: buildChoices(answer, levelChords, allChords, rng),
  }));
}

export function scorePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
