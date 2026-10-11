import { useState } from 'react';
import { LEVELS } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { loadProgress } from '../lib/progress';
import { formatRoute } from '../lib/route';
import { MAX_LIVES, MAX_QUESTIONS } from '../lib/challenge';

export default function Home() {
  const [progress] = useState(() => loadProgress());

  return (
    <main className="page">
      <h1>ギターコード練習</h1>
      <p className="muted">コードの形と、各弦で鳴っている音をセットで覚えよう。</p>
      <div className="actions">
        <a className="button secondary" href={formatRoute({ page: 'chart' })}>コード早見表</a>
      </div>
      <section className="level-card challenge-card">
        <h2>チャレンジモード</h2>
        <p className="muted">選んだタイプのコードからランダムに出題。ライフ {MAX_LIVES} つで最大 {MAX_QUESTIONS} 問に挑戦します。</p>
        <div className="actions">
          <a className="button" href={formatRoute({ page: 'challenge' })}>挑戦する</a>
        </div>
      </section>
      <div className="level-grid">
        {LEVELS.map((level) => {
          const record = progress[level];
          return (
            <section key={level} className="level-card">
              <h2>Lv{level} {LEVEL_INFO[level].title}</h2>
              <p className="muted">{LEVEL_INFO[level].description}</p>
              <p>
                {record ? `最高正答率 ${record.bestScore}% / ハイスコア ${record.bestPoints.toLocaleString('ja-JP')}pt` : '未挑戦'}
                {record?.cleared && <span className="badge">クリア済み</span>}
              </p>
              <div className="actions">
                <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習</a>
                <a className="button" href={formatRoute({ page: 'quiz', level })}>クイズ</a>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
