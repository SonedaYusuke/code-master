import { useState } from 'react';
import type { Level } from '../model';
import { LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { formatRoute } from '../lib/route';
import ChordCard from '../components/ChordCard';
import QuizModeDialog from '../components/QuizModeDialog';

export default function Study({ level }: { level: Level }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{LEVEL_INFO[level].description}</p>
      <div className="actions">
        <button className="button" onClick={() => setDialogOpen(true)}>クイズに挑戦</button>
      </div>
      <div className="chord-grid">
        {chordsOfLevel(level).map((chord) => (
          <ChordCard key={chord.id} chord={chord} />
        ))}
      </div>
      <QuizModeDialog level={dialogOpen ? level : null} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
