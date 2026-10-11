import type { Note } from '../model';
import { CHART } from '../data/chart';
import { formatRoute } from '../lib/route';
import ChordCard from '../components/ChordCard';

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
      <p className="muted">12のルートごとに、メジャー・m・7・m7・maj7・sus4・add9 の押さえ方をまとめています。</p>
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
          <div className="chord-grid">
            {chords.map((chord) => (
              <ChordCard key={chord.id} chord={chord} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
