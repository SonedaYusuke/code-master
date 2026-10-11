import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from './route';

describe('parseRoute', () => {
  it.each([
    ['#/level/1/study', { page: 'study', level: 1 }],
    ['#/level/3/quiz', { page: 'quiz', level: 3 }],
    ['#/level/5/result', { page: 'result', level: 5 }],
    ['#/level/2/build', { page: 'build', level: 2 }],
    ['#/chart', { page: 'chart' }],
    ['#/challenge', { page: 'challenge' }],
  ])('%s を解析する', (hash, expected) => {
    expect(parseRoute(hash)).toEqual(expected);
  });

  it.each(['', '#', '#/', '#/foo', '#/level/0/quiz', '#/level/9/quiz', '#/level/abc/study', '#/level/1/play', '#/level/1/quiz/extra', '#/chart/C'])(
    '%s はホームになる',
    (hash) => {
      expect(parseRoute(hash)).toEqual({ page: 'home' });
    },
  );
});

describe('formatRoute', () => {
  it('ルートを hash に戻す', () => {
    expect(formatRoute({ page: 'home' })).toBe('#/');
    expect(formatRoute({ page: 'quiz', level: 2 })).toBe('#/level/2/quiz');
    expect(formatRoute({ page: 'chart' })).toBe('#/chart');
    expect(formatRoute({ page: 'challenge' })).toBe('#/challenge');
  });

  it('parseRoute と往復できる', () => {
    expect(parseRoute(formatRoute({ page: 'study', level: 4 }))).toEqual({ page: 'study', level: 4 });
  });
});
