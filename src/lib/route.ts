import { isLevel, type Level } from '../model';

type LevelPage = 'study' | 'quiz' | 'result';
export type Route = { page: 'home' } | { page: LevelPage; level: Level };

export function parseRoute(hash: string): Route {
  const match = hash.match(/^#\/level\/(\d+)\/(study|quiz|result)$/);
  if (match) {
    const level = Number(match[1]);
    if (isLevel(level)) return { page: match[2] as LevelPage, level };
  }
  return { page: 'home' };
}

export function formatRoute(route: Route): string {
  return route.page === 'home' ? '#/' : `#/level/${route.level}/${route.page}`;
}
