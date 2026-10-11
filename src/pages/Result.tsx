import { useEffect, useState } from 'react';
import type { Level } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { MODE_LABELS, type QuizResult } from '../lib/quiz';
import { maxPointsFor } from '../lib/scoring';
import { formatRoute } from '../lib/route';
import { navigate } from '../router';
import ChordCard from '../components/ChordCard';
import QuizModeDialog from '../components/QuizModeDialog';
import ResultSummary from '../components/ResultSummary';

type Props = { level: Level; result: QuizResult | null };

export default function Result({ level, result }: Props) {
  const valid = result !== null && result.level === level;
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!valid) navigate({ page: 'quiz', level }, true);
  }, [valid, level]);

  if (!valid) return null;

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>結果</h1>
      <ResultSummary
        title={`Lv${level} ${LEVEL_INFO[level].title}`}
        description={LEVEL_INFO[level].description}
        heading={MODE_LABELS[result.mode]}
        points={result.points}
        maxPoints={maxPointsFor(result.total)}
        newHighScore={result.newHighScore}
        stats={[
          { label: '正解', value: `${result.correct} / ${result.total}` },
          { label: '最大コンボ', value: `${result.maxCombo}` },
        ]}
        actions={
          <>
            <button className="button" onClick={() => setDialogOpen(true)}>もう一度</button>
            <a className="button secondary" href={formatRoute({ page: 'study', level })}>学習に戻る</a>
          </>
        }
      />
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
      <QuizModeDialog level={dialogOpen ? level : null} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
