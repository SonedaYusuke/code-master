import { useState } from 'react';
import { LEVELS, type Level } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { formatRoute } from '../lib/route';
import { MAX_LIVES, MAX_QUESTIONS } from '../lib/challenge';
import QuizModeDialog from '../components/QuizModeDialog';
import RulesDialog from '../components/RulesDialog';

export default function Home() {
  const [dialogLevel, setDialogLevel] = useState<Level | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className="page">
      <h1>ギターコード練習</h1>
      <p className="muted">コードの形と、各弦で鳴っている音をセットで覚えよう。</p>
      <div className="actions">
        <a className="button secondary" href={formatRoute({ page: 'chart' })}>コード早見表</a>
      </div>
      <section className="level-card challenge-card">
        <h2>チャレンジモード</h2>
        <p className="muted">選んだコードからランダムに出題。ライフ {MAX_LIVES} つで最大 {MAX_QUESTIONS} 問に挑戦します。</p>
        <div className="actions">
          <a className="button" href={formatRoute({ page: 'challenge' })}>挑戦する</a>
        </div>
      </section>
      <div className="level-grid">
        {LEVELS.map((level) => (
          <section key={level} className="level-card">
            <h2>Lv{level} {LEVEL_INFO[level].title}</h2>
            <p className="muted">{LEVEL_INFO[level].description}</p>
            <div className="actions">
              <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習</a>
              <button className="button" onClick={() => setDialogLevel(level)}>クイズ</button>
            </div>
          </section>
        ))}
      </div>
      <QuizModeDialog level={dialogLevel} onClose={() => setDialogLevel(null)} />
      <button className="help-button" aria-label="遊び方" onClick={() => setRulesOpen(true)}>?</button>
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
