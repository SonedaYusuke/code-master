import { isLevel, type Level } from '../model';

type LevelPage = 'study' | 'quiz' | 'build' | 'result';
export type Route = { page: 'home' } | { page: 'chart' } | { page: 'challenge' } | { page: LevelPage; level: Level };

export function parseRoute(hash: string): Route {
  if (hash === '#/chart') return { page: 'chart' };
  if (hash === '#/challenge') return { page: 'challenge' };
  const match = hash.match(/^#\/level\/(\d+)\/(study|quiz|build|result)$/);
  if (match) {
    const level = Number(match[1]);
    if (isLevel(level)) return { page: match[2] as LevelPage, level };
  }
  return { page: 'home' };
}

export function formatRoute(route: Route): string {
  if (route.page === 'home') return '#/';
  if (route.page === 'chart') return '#/chart';
  if (route.page === 'challenge') return '#/challenge';
  return `#/level/${route.level}/${route.page}`;
}
