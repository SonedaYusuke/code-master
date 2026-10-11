import { describe, expect, it } from 'vitest';
import type { Chord } from '../model';
import { chordTones, rootNote, stringNotes } from './notes';

const chord = (id: string, frets: (number | null)[]): Chord => ({ id, name: id, level: 1, frets });

describe('stringNotes', () => {
  it('C の押さえ方から各弦の音を求める', () => {
    expect(stringNotes(chord('C', [null, 3, 2, 0, 1, 0]))).toEqual([null, 'C', 'E', 'G', 'C', 'E']);
  });

  it('12フレットを超えても1周して求める', () => {
    expect(stringNotes(chord('X', [12, 13, null, null, null, null]))).toEqual(['E', 'A#', null, null, null, null]);
  });
});

describe('rootNote', () => {
  it('一番低い鳴っている弦の音をルートにする', () => {
    expect(rootNote(chord('D', [null, null, 0, 2, 3, 2]))).toBe('D');
  });

  it('鳴っている弦がなければ例外を投げる', () => {
    expect(() => rootNote(chord('X', [null, null, null, null, null, null]))).toThrow();
  });
});

describe('chordTones', () => {
  it('重複を除き、ルートからの音程順に並べる', () => {
    expect(chordTones(chord('C', [null, 3, 2, 0, 1, 0]))).toEqual(['C', 'E', 'G']);
  });

  it('ルートより低い音名でも音程順に並ぶ', () => {
    // A7: A E G C# E → A C# E G
    expect(chordTones(chord('A7', [null, 0, 2, 0, 2, 0]))).toEqual(['A', 'C#', 'E', 'G']);
  });
});
