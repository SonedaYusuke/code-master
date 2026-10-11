import type { ChartChord, ChartSection, ChartType, Frequency } from '../data/chart';

export type ChartFilter = { types: ReadonlySet<ChartType>; frequencies: ReadonlySet<Frequency> };

/** 同じグループの中は OR、タイプと頻出度は AND。何も選んでいないグループは条件にしない */
function matches(chord: ChartChord, { types, frequencies }: ChartFilter): boolean {
  if (types.size > 0 && !types.has(chord.type)) return false;
  if (frequencies.size > 0 && !(chord.frequency && frequencies.has(chord.frequency))) return false;
  return true;
}

export function filterChart(sections: readonly ChartSection[], filter: ChartFilter): ChartSection[] {
  if (filter.types.size === 0 && filter.frequencies.size === 0) return [...sections];
  return sections
    .map((section) => ({ ...section, chords: section.chords.filter((chord) => matches(chord, filter)) }))
    .filter((section) => section.chords.length > 0);
}
