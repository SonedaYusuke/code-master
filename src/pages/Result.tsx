import { useEffect } from 'react';
import type { Level } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { CLEAR_THRESHOLD } from '../lib/progress';
import type { QuizResult } from '../lib/quiz';
import { formatRoute } from '../lib/route';
import { navigate } from '../router';
import ChordCard from '../components/ChordCard';

type Props = { level: Level; result: QuizResult | null };

export default function Result({ level, result }: Props) {
  const valid = result !== null && result.level === level;

  useEffect(() => {
    if (!valid) navigate({ page: 'quiz', level }, true);
  }, [valid, level]);

  if (!valid) return null;

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title} の結果</h1>
      {result.newHighScore && <p className="high-score">ハイスコア更新！</p>}
      <p className="score">{result.points.toLocaleString('ja-JP')} pt</p>
      <p>
        正答率 {result.score}%（{result.total} 問中 {result.correct} 問正解）
        {result.score >= CLEAR_THRESHOLD && ' — クリア！'}
      </p>
      <p>最大コンボ {result.maxCombo}</p>
      <div className="actions">
        <a className="button" href={formatRoute({ page: 'quiz', level })}>もう一度</a>
        <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習に戻る</a>
      </div>
      {result.wrong.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>間違えたコード</h2>
          <div className="chord-grid">
            {result.wrong.map((chord) => (
              <ChordCard key={chord.id} chord={chord} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
