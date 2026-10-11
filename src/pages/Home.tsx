import { useState } from 'react';
import { LEVELS } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { loadProgress } from '../lib/progress';
import { formatRoute } from '../lib/route';
import { MAX_LIVES, MAX_QUESTIONS } from '../lib/challenge';

export default function Home() {
  const [progress] = useState(() => loadProgress());
  const [buildProgress] = useState(() => loadProgress(undefined, 'build'));
  const [shapeProgress] = useState(() => loadProgress(undefined, 'shape'));

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
          const buildRecord = buildProgress[level];
          const shapeRecord = shapeProgress[level];
          return (
            <section key={level} className="level-card">
              <h2>Lv{level} {LEVEL_INFO[level].title}</h2>
              <p className="muted">{LEVEL_INFO[level].description}</p>
              <p>
                4択: {record ? `最高正答率 ${record.bestScore}% / ハイスコア ${record.bestPoints.toLocaleString('ja-JP')}pt` : '未挑戦'}
                {record?.cleared && <span className="badge">クリア済み</span>}
              </p>
              <p>
                ルート＋タイプ: {buildRecord ? `ハイスコア ${buildRecord.bestPoints.toLocaleString('ja-JP')}pt` : '未挑戦'}
              </p>
              <p>
                形を選ぶ: {shapeRecord ? `ハイスコア ${shapeRecord.bestPoints.toLocaleString('ja-JP')}pt` : '未挑戦'}
              </p>
              <div className="actions">
                <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習</a>
                <a className="button" href={formatRoute({ page: 'quiz', level })}>4択</a>
                <a className="button" href={formatRoute({ page: 'build', level })}>ルート＋タイプ</a>
                <a className="button" href={formatRoute({ page: 'shape', level })}>形を選ぶ</a>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
