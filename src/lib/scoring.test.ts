import { describe, expect, it } from 'vitest';
import { TIME_LIMIT_MS, pointsFor, timeLimitFor } from './scoring';

describe('timeLimitFor', () => {
  it('4択と形を選ぶは10秒、ルート＋タイプも10秒', () => {
    expect(timeLimitFor('choice')).toBe(10000);
    expect(timeLimitFor('shape')).toBe(10000);
    expect(timeLimitFor('build')).toBe(10000);
  });
});

describe('pointsFor', () => {
  it('不正解・時間切れは 0pt', () => {
    expect(pointsFor(false, 4000, 0)).toBe(0);
    expect(pointsFor(false, 0, 0)).toBe(0);
  });

  it('正解は基本 100pt に、残り時間に比例したボーナス（最大 100pt）を足す', () => {
    expect(pointsFor(true, TIME_LIMIT_MS, 1)).toBe(200);
    expect(pointsFor(true, TIME_LIMIT_MS / 2, 1)).toBe(150);
    expect(pointsFor(true, 0, 1)).toBe(100);
  });

  it('2連続目から 20pt ずつコンボボーナスが増え、最大 100pt', () => {
    expect(pointsFor(true, 0, 2)).toBe(120);
    expect(pointsFor(true, 0, 3)).toBe(140);
    expect(pointsFor(true, 0, 6)).toBe(200);
    expect(pointsFor(true, 0, 10)).toBe(200);
  });

  it('1問の最大は 300pt', () => {
    expect(pointsFor(true, TIME_LIMIT_MS, 99)).toBe(300);
  });

  it('制限時間を渡すと、その長さを基準に時間ボーナスを計算する', () => {
    expect(pointsFor(true, 10000, 1, 10000)).toBe(200);
    expect(pointsFor(true, 5000, 1, 10000)).toBe(150);
  });

  it('範囲外の残り時間は 0〜制限時間に丸める', () => {
    expect(pointsFor(true, -500, 1)).toBe(100);
    expect(pointsFor(true, TIME_LIMIT_MS * 2, 1)).toBe(200);
  });
});
