import type { Level } from '../model';
import { LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { formatRoute } from '../lib/route';
import ChordCard from '../components/ChordCard';

export default function Study({ level }: { level: Level }) {
  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{LEVEL_INFO[level].description}</p>
      <div className="actions">
        <a className="button" href={formatRoute({ page: 'quiz', level })}>クイズに挑戦</a>
      </div>
      <div className="chord-grid">
        {chordsOfLevel(level).map((chord) => (
          <ChordCard key={chord.id} chord={chord} />
        ))}
      </div>
    </main>
  );
}
