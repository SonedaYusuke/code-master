import { describe, expect, it } from 'vitest';
import { CHART, CHART_TYPES, type ChartType } from '../data/chart';
import { filterChart } from './chartFilter';

const ids = (types: ChartType[]) =>
  filterChart(CHART, new Set(types)).flatMap((section) => section.chords.map((c) => c.id));

describe('filterChart', () => {
  it('何も選ばなければ全コードを返す', () => {
    expect(filterChart(CHART, new Set())).toEqual(CHART);
  });

  it('選んだタイプのどれかに当てはまるコードだけ返す（OR）', () => {
    const result = ids(['', 'm']);
    expect(result).toHaveLength(24);
    expect(result.slice(0, 4)).toEqual(['C', 'Cm', 'C#', 'C#m']);
  });

  it('ルートの半音順と、ルート内のタイプ順を保つ', () => {
    const result = filterChart(CHART, new Set<ChartType>(['maj7', 'm']));
    expect(result.map((s) => s.root)).toEqual(CHART.map((s) => s.root));
    expect(result[0].chords.map((c) => c.id)).toEqual(['Cm', 'Cmaj7']);
  });

  it('元のデータを書き換えない', () => {
    filterChart(CHART, new Set<ChartType>(['7']));
    expect(CHART[0].chords).toHaveLength(CHART_TYPES.length);
  });
});
