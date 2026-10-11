import { describe, expect, it } from 'vitest';
import { CHORDS, chordsOfLevel } from '../data/chords';
import { CHOICE_COUNT, QUESTION_COUNT, generateQuiz, scorePercent } from './quiz';

/** テスト用の再現可能な乱数 */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

describe('generateQuiz', () => {
  it('10問出題する', () => {
    expect(generateQuiz(chordsOfLevel(1), CHORDS, seededRng(1))).toHaveLength(QUESTION_COUNT);
  });

  it('10個以上のレベルでは同じコードを2回出さない', () => {
    const ids = generateQuiz(chordsOfLevel(2), CHORDS, seededRng(2)).map((q) => q.answer.id);
    expect(new Set(ids).size).toBe(QUESTION_COUNT);
  });

  it('10個未満のレベルでも10問出し、全コードが少なくとも1回出る', () => {
    const level1 = chordsOfLevel(1);
    const questions = generateQuiz(level1, CHORDS, seededRng(3));
    expect(questions).toHaveLength(QUESTION_COUNT);
    expect(new Set(questions.map((q) => q.answer.id))).toEqual(new Set(level1.map((c) => c.id)));
  });

  it('選択肢は4つで重複がなく、正解がちょうど1つ含まれる', () => {
    for (const seed of [4, 5, 6]) {
      for (const q of generateQuiz(chordsOfLevel(5), CHORDS, seededRng(seed))) {
        const ids = q.choices.map((c) => c.id);
        expect(ids).toHaveLength(CHOICE_COUNT);
        expect(new Set(ids).size).toBe(CHOICE_COUNT);
        expect(ids.filter((id) => id === q.answer.id)).toHaveLength(1);
      }
    }
  });

  it('不正解の選択肢は同じレベルのコードを優先する', () => {
    for (const q of generateQuiz(chordsOfLevel(2), CHORDS, seededRng(7))) {
      expect(q.choices.every((c) => c.level === 2)).toBe(true);
    }
  });

  it('同じレベルが足りないときは他のレベルから補う', () => {
    const twoChords = chordsOfLevel(1).slice(0, 2);
    for (const q of generateQuiz(twoChords, CHORDS, seededRng(8))) {
      expect(q.choices).toHaveLength(CHOICE_COUNT);
      expect(new Set(q.choices.map((c) => c.id)).size).toBe(CHOICE_COUNT);
    }
  });

  it('他のレベルから補うときも、選択肢に同じ名前を並べない', () => {
    // Lv5 の C7（Lv3 にも同じ名前がある）を、他のレベルだけで補う状況を作る
    const answer = chordsOfLevel(5).find((c) => c.name === 'C7')!;
    for (const seed of [9, 10, 11, 12]) {
      for (const q of generateQuiz([answer], CHORDS, seededRng(seed))) {
        const names = q.choices.map((c) => c.name);
        expect(new Set(names).size).toBe(CHOICE_COUNT);
      }
    }
  });

  it('コードが空なら例外を投げる', () => {
    expect(() => generateQuiz([], CHORDS)).toThrow();
  });
});

describe('scorePercent', () => {
  it('正答率を整数の % で返す', () => {
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(0, 0)).toBe(0);
  });
});
