import { isLevel, type Level } from '../model';
import type { QuizMode } from './quiz';

type LevelPage = 'study' | 'quiz' | 'build' | 'shape' | 'result';
export type Route = { page: 'home' } | { page: 'chart' } | { page: 'challenge' } | { page: LevelPage; level: Level };

export function parseRoute(hash: string): Route {
  if (hash === '#/chart') return { page: 'chart' };
  if (hash === '#/challenge') return { page: 'challenge' };
  const match = hash.match(/^#\/level\/(\d+)\/(study|quiz|build|shape|result)$/);
  if (match) {
    const level = Number(match[1]);
    if (isLevel(level)) return { page: match[2] as LevelPage, level };
  }
  return { page: 'home' };
}

const QUIZ_PAGES: Record<QuizMode, 'quiz' | 'build' | 'shape'> = { choice: 'quiz', build: 'build', shape: 'shape' };

export function quizRoute(level: Level, mode: QuizMode): Route {
  return { page: QUIZ_PAGES[mode], level };
}

export function formatRoute(route: Route): string {
  if (route.page === 'home') return '#/';
  if (route.page === 'chart') return '#/chart';
  if (route.page === 'challenge') return '#/challenge';
  return `#/level/${route.level}/${route.page}`;
}
