import type { ChartChord, ChartSection, ChartType, Frequency } from '../data/chart';

/** simplified: 省略形の押さえ方を選んでいるか。頻出度と同じグループとして扱う */
export type ChartFilter = { types: ReadonlySet<ChartType>; frequencies: ReadonlySet<Frequency>; simplified: boolean };

/**
 * タイプが合わないコードは除き、頻出度を選んでいれば当てはまる形だけを残す。
 * 同じグループの中は OR、タイプと頻出度は AND。何も選んでいないグループは条件にしない
 */
function filterChord(chord: ChartChord, { types, frequencies, simplified }: ChartFilter): ChartChord | null {
  if (types.size > 0 && !types.has(chord.type)) return null;
  if (frequencies.size === 0 && !simplified) return chord;
  const voicings = chord.voicings.filter(
    (v) => (v.frequency && frequencies.has(v.frequency)) || (simplified && v.label === '省略形'),
  );
  return voicings.length > 0 ? { ...chord, voicings } : null;
}

export function filterChart(sections: readonly ChartSection[], filter: ChartFilter): ChartSection[] {
  if (filter.types.size === 0 && filter.frequencies.size === 0 && !filter.simplified) return [...sections];
  return sections
    .map((section) => ({
      ...section,
      chords: section.chords.map((chord) => filterChord(chord, filter)).filter((c): c is ChartChord => c !== null),
    }))
    .filter((section) => section.chords.length > 0);
}
