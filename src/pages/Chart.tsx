import type { Note } from '../model';
import { CHART } from '../data/chart';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';

const sectionId = (root: Note) => `root-${root}`;

export default function Chart() {
  // href="#..." はハッシュルーティングとぶつかるので、ボタンでスクロールする
  function jumpTo(root: Note) {
    document.getElementById(sectionId(root))?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>コード早見表</h1>
      <p className="muted">12のルートごとに、メジャー・m・7・m7・maj7・sus4・add9 の押さえ方を、低いポジションから順にまとめています。</p>
      <nav className="root-nav">
        {CHART.map(({ root }) => (
          <button key={root} className="button secondary" onClick={() => jumpTo(root)}>
            {root}
          </button>
        ))}
      </nav>
      {CHART.map(({ root, chords }) => (
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
