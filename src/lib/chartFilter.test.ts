import { describe, expect, it } from 'vitest';
import { CHART, CHART_TYPES, type ChartType, type Frequency } from '../data/chart';
import { filterChart } from './chartFilter';

const ids = (types: ChartType[], frequencies: Frequency[] = []) =>
  filterChart(CHART, { types: new Set(types), frequencies: new Set(frequencies), simplified: false }).flatMap((section) =>
    section.chords.map((c) => c.id),
  );

describe('filterChart', () => {
  it('何も選ばなければ全コードを返す', () => {
    expect(filterChart(CHART, { types: new Set(), frequencies: new Set(), simplified: false })).toEqual(CHART);
  });

  it('選んだタイプのどれかに当てはまるコードだけ返す（OR）', () => {
    const result = ids(['', 'm']);
    expect(result).toHaveLength(24);
    expect(result.slice(0, 4)).toEqual(['C', 'Cm', 'C#', 'C#m']);
  });

  it('ルートの半音順と、ルート内のタイプ順を保つ', () => {
    const result = filterChart(CHART, { types: new Set<ChartType>(['maj7', 'm']), frequencies: new Set(), simplified: false });
    expect(result.map((s) => s.root)).toEqual(CHART.map((s) => s.root));
    expect(result[0].chords.map((c) => c.id)).toEqual(['Cm', 'Cmaj7']);
  });

  it('頻出度は選んだもののどれかに当てはまるコードを返す（OR）', () => {
    expect(ids([], ['top'])).toEqual(['C', 'Cmaj7', 'D', 'Dm', 'E', 'Em', 'E7', 'F', 'G', 'G7', 'A', 'Am', 'A#', 'Bm']);
    expect(ids([], ['top', 'common'])).toHaveLength(14 + 28);
  });

  it('頻出度で絞り込むと、当てはまる形だけを残す', () => {
    const chords = (frequencies: Frequency[]) =>
      filterChart(CHART, { types: new Set(), frequencies: new Set(frequencies), simplified: false }).flatMap((s) => s.chords);
    const labelsOf = (frequencies: Frequency[], id: string) =>
      chords(frequencies).find((c) => c.id === id)?.voicings.map((v) => v.label);
    expect(labelsOf(['top'], 'C')).toEqual(['オープン']);
    expect(labelsOf(['common'], 'C')).toEqual(['5弦ルート']);
    expect(labelsOf(['top', 'common'], 'C')).toEqual(['オープン', '5弦ルート']);
  });

  it('タイプと頻出度は両方を満たすコードを返す（AND）', () => {
    expect(ids(['m7'], ['common'])).toEqual(['Dm7', 'Em7', 'F#m7', 'Am7', 'Bm7']);
  });

  it('当てはまるコードがないルートは除く', () => {
    expect(filterChart(CHART, { types: new Set(), frequencies: new Set<Frequency>(['top']), simplified: false }).map((s) => s.root)).toEqual([
      'C', 'D', 'E', 'F', 'G', 'A', 'A#', 'B',
    ]);
  });

  it('省略形を選ぶと省略形の形だけを残す', () => {
    const result = filterChart(CHART, { types: new Set(), frequencies: new Set(), simplified: true }).flatMap((s) => s.chords);
    expect(result.map((c) => c.id)).toEqual(expect.arrayContaining(['F', 'Fm', 'Fmaj7', 'F#m', 'F#m7', 'Bm7']));
    expect(result.every((c) => c.voicings.every((v) => v.label === '省略形'))).toBe(true);
  });

  it('省略形と頻出度は同じグループとして、どちらかに当てはまる形を残す（OR）', () => {
    const f = filterChart(CHART, { types: new Set<ChartType>(['']), frequencies: new Set<Frequency>(['top']), simplified: true })
      .flatMap((s) => s.chords)
      .find((c) => c.id === 'F');
    expect(f?.voicings.map((v) => v.label)).toEqual(['6弦ルート', '省略形']);
  });

  it('元のデータを書き換えない', () => {
    filterChart(CHART, { types: new Set<ChartType>(['7']), frequencies: new Set(), simplified: false });
    expect(CHART[0].chords).toHaveLength(CHART_TYPES.length);
  });
});
