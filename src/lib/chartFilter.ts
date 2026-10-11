import type { ChartSection, ChartType } from '../data/chart';

/** 選んだタイプのどれかに当てはまるコードだけを残す（OR）。何も選んでいなければ全部 */
export function filterChart(sections: readonly ChartSection[], selected: ReadonlySet<ChartType>): ChartSection[] {
  if (selected.size === 0) return [...sections];
  return sections
    .map((section) => ({ ...section, chords: section.chords.filter((chord) => selected.has(chord.type)) }))
    .filter((section) => section.chords.length > 0);
}
