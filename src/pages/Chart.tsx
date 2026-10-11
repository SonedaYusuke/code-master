import { useState } from 'react';
import type { Note } from '../model';
import { CHART, CHART_TYPES, CHART_TYPE_LABELS, type ChartType } from '../data/chart';
import { filterChart } from '../lib/chartFilter';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';

const sectionId = (root: Note) => `root-${root}`;

export default function Chart() {
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<ChartType>>(new Set());
  const sections = filterChart(CHART, selectedTypes);

  function toggleType(type: ChartType) {
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  // href="#..." はハッシュルーティングとぶつかるので、ボタンでスクロールする
  function jumpTo(root: Note) {
    document.getElementById(sectionId(root))?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>コード早見表</h1>
      <p className="muted">12のルートごとに、M・m・7・m7・M7・sus4・add9 の押さえ方を、低いポジションから順にまとめています。</p>
      <div className="chart-toolbar">
        <nav className="root-nav">
          {CHART.map(({ root }) => (
            <button key={root} className="button secondary" onClick={() => jumpTo(root)}>
              {root}
            </button>
          ))}
        </nav>
        <div className="type-filter" role="group" aria-label="コードタイプで絞り込む">
          {CHART_TYPES.map((type) => (
            <button
              key={type}
              className={selectedTypes.has(type) ? 'chip selected' : 'chip'}
              aria-pressed={selectedTypes.has(type)}
              onClick={() => toggleType(type)}
            >
              {CHART_TYPE_LABELS[type]}
            </button>
          ))}
          {selectedTypes.size > 0 && (
            <button className="chip clear" onClick={() => setSelectedTypes(new Set())}>
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
                    <figcaption>{voicing.label}</figcaption>
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
