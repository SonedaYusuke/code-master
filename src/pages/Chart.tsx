import { useState } from 'react';
import type { Note } from '../model';
import {
  CHART,
  CHART_TYPES,
  CHART_TYPE_LABELS,
  FREQUENCY_LABELS,
  type ChartType,
  type Frequency,
  type Voicing,
} from '../data/chart';
import { filterChart } from '../lib/chartFilter';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';

const sectionId = (root: Note) => `root-${root}`;
const FREQUENCY_ORDER: Frequency[] = ['top', 'common'];

/** 省略形は「省略」バッジで示すので、見出しは一番低い弦の何弦ルートかにする */
function positionLabel(voicing: Voicing): string {
  if (voicing.label !== '省略形') return voicing.label;
  return `${6 - voicing.frets.findIndex((f) => f !== null)}弦ルート`;
}

function toggled<T>(current: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function Chart() {
  const [types, setTypes] = useState<ReadonlySet<ChartType>>(new Set());
  const [frequencies, setFrequencies] = useState<ReadonlySet<Frequency>>(new Set());
  const [simplified, setSimplified] = useState(false);
  const sections = filterChart(CHART, { types, frequencies, simplified });
  const visibleRoots = new Set(sections.map((s) => s.root));
  const filtering = types.size > 0 || frequencies.size > 0 || simplified;

  function clearFilter() {
    setTypes(new Set());
    setFrequencies(new Set());
    setSimplified(false);
  }

  // href="#..." はハッシュルーティングとぶつかるので、ボタンでスクロールする
  function jumpTo(root: Note) {
    document.getElementById(sectionId(root))?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>コード早見表</h1>
      <p className="muted">12のルートごとに、14種類のコードの押さえ方を、低いポジションから順にまとめています。</p>
      <div className="chart-toolbar">
        <nav className="root-nav">
          {CHART.map(({ root }) => (
            <button
              key={root}
              className="button secondary"
              disabled={!visibleRoots.has(root)}
              onClick={() => jumpTo(root)}
            >
              {root}
            </button>
          ))}
        </nav>
        <div className="type-filter" role="group" aria-label="頻出度・省略形とコードで絞り込む">
          {FREQUENCY_ORDER.map((frequency) => (
            <button
              key={frequency}
              className={frequencies.has(frequency) ? `chip freq-${frequency} selected` : `chip freq-${frequency}`}
              aria-pressed={frequencies.has(frequency)}
              onClick={() => setFrequencies((current) => toggled(current, frequency))}
            >
              {FREQUENCY_LABELS[frequency]}
            </button>
          ))}
          <button
            className={simplified ? 'chip simplified selected' : 'chip simplified'}
            aria-pressed={simplified}
            onClick={() => setSimplified((current) => !current)}
          >
            省略
          </button>
          <span className="filter-divider" aria-hidden="true" />
          {CHART_TYPES.map((type) => (
            <button
              key={type}
              className={types.has(type) ? 'chip selected' : 'chip'}
              aria-pressed={types.has(type)}
              onClick={() => setTypes((current) => toggled(current, type))}
            >
              {CHART_TYPE_LABELS[type]}
            </button>
          ))}
          {filtering && (
            <button className="chip clear" onClick={clearFilter}>
              すべて解除
            </button>
          )}
        </div>
      </div>
      {sections.map(({ root, chords }) => (
        <section key={root} id={sectionId(root)} className="chart-section">
          <h2 className="chart-root">{root}</h2>
          {chords.map((chord) => (
            <section key={chord.id} className="chart-chord">
              <div className="chart-chord-head">
                <h3>{chord.name}</h3>
                <p className="muted">構成音: {chord.tones.join('・')}</p>
              </div>
              <div className="voicings">
                {chord.voicings.map((voicing) => (
                  <figure key={voicing.id} className="voicing">
                    <ChordDiagram chord={voicing} showNotes />
                    <figcaption>
                      {positionLabel(voicing)}
                      {voicing.label === '省略形' && <span className="freq-badge simplified">省略</span>}
                      {voicing.frequency && (
                        <span className={`freq-badge freq-${voicing.frequency}`}>{FREQUENCY_LABELS[voicing.frequency]}</span>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </section>
      ))}
    </main>
  );
}
