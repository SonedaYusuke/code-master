import { useEffect, useMemo, useState } from 'react';
import { CHART_TYPES, CHART_TYPE_LABELS, type ChartType } from '../data/chart';
import { MAX_LIVES, MAX_QUESTIONS, buildPool, isFinished, nextQuestion, type ChallengeItem } from '../lib/challenge';
import { loadChallengeBest, saveChallengeResult, selectionKey } from '../lib/challengeRecord';
import { pointsFor } from '../lib/scoring';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';
import TimerBar from '../components/TimerBar';
import { useCountdown } from '../hooks/useCountdown';
import { useQuestionTimer } from '../hooks/useQuestionTimer';

const DEFAULT_TYPES: ChartType[] = ['', 'm', '7', 'm7'];
const AUTO_NEXT_MS = 800;

type Summary = {
  points: number;
  correct: number;
  answered: number;
  maxCombo: number;
  completed: boolean;
  newHighScore: boolean;
  best: number;
};

export default function Challenge() {
  const [types, setTypes] = useState<ReadonlySet<ChartType>>(new Set(DEFAULT_TYPES));
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [run, setRun] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const pool = useMemo(() => buildPool(types), [types]);
  const recordKey = selectionKey(types);

  function toggle(type: ChartType) {
    setTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function start() {
    setRun((n) => n + 1);
    setPhase('playing');
  }

  function finish(result: Summary) {
    setSummary(result);
    setPhase('result');
  }

  if (phase === 'playing') return <ChallengeGame key={run} pool={pool} recordKey={recordKey} onFinish={finish} />;

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>チャレンジモード</h1>

      {phase === 'result' && summary ? (
        <section className="challenge-result">
          <h2>{summary.completed ? `${MAX_QUESTIONS}問完走！` : 'ゲームオーバー'}</h2>
          {summary.newHighScore && <p className="high-score">ハイスコア更新！</p>}
          <p className="score">{summary.points.toLocaleString('ja-JP')} pt</p>
          <p>{summary.answered} 問中 {summary.correct} 問正解 / 最大コンボ {summary.maxCombo}</p>
          <p className="muted">出題タイプ: {recordKey} / ハイスコア {summary.best.toLocaleString('ja-JP')}pt</p>
          <div className="actions">
            <button className="button" onClick={start}>もう一度</button>
            <button className="button secondary" onClick={() => setPhase('setup')}>タイプを選び直す</button>
          </div>
        </section>
      ) : (
        <section>
          <p className="muted">
            選んだタイプのコードからランダムに出題します。ライフは {MAX_LIVES} つで、不正解か時間切れで1つ減ります。最大 {MAX_QUESTIONS} 問。
          </p>
          <h2 style={{ marginTop: 20 }}>出題するタイプ</h2>
          <div className="type-picker" role="group" aria-label="出題するタイプ">
            {CHART_TYPES.map((type) => (
              <button
                key={type}
                className={types.has(type) ? 'chip selected' : 'chip'}
                aria-pressed={types.has(type)}
                onClick={() => toggle(type)}
              >
                {CHART_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="chip" onClick={() => setTypes(new Set(CHART_TYPES))}>すべて選択</button>
            <button className="chip clear" onClick={() => setTypes(new Set())}>すべて解除</button>
          </div>
          <p style={{ marginTop: 16 }}>
            出題される形: <strong>{pool.length}</strong> 個
            {pool.length > 0 && ` / ハイスコア ${loadChallengeBest(recordKey).toLocaleString('ja-JP')}pt`}
          </p>
          <div className="actions">
            <button className="button" disabled={pool.length === 0} onClick={start}>スタート</button>
          </div>
        </section>
      )}
    </main>
  );
}

type GameProps = { pool: ChallengeItem[]; recordKey: string; onFinish: (summary: Summary) => void };

/** 回答結果。choice が null なら時間切れ */
type Answer = { choice: string | null; points: number };

function ChallengeGame({ pool, recordKey, onFinish }: GameProps) {
  const countdown = useCountdown();
  const [question, setQuestion] = useState(() => nextQuestion(pool, null));
  const [number, setNumber] = useState(1);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);

  const playing = countdown <= 0;
  const answered = answer !== null;
  const isCorrect = answer?.choice === question.item.name;
  const { remainingMs, stop } = useQuestionTimer(playing && !answered, number);

  useEffect(() => {
    if (playing && !answered && remainingMs <= 0) resolve(null);
  }, [playing, answered, remainingMs]);

  // 正解したら少し待って自動で次へ
  useEffect(() => {
    if (!answered || !isCorrect) return;
    const timer = setTimeout(next, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [answered, isCorrect]);

  function resolve(choice: string | null) {
    if (answered) return;
    const remaining = stop();
    const right = choice === question.item.name;
    const nextCombo = right ? combo + 1 : 0;
    const gained = pointsFor(right, remaining, nextCombo);
    setAnswer({ choice, points: gained });
    setPoints((p) => p + gained);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    if (right) setCorrect((n) => n + 1);
    else setLives((n) => n - 1);
  }

  function next() {
    if (isFinished(lives, number)) {
      const { best, newHighScore } = saveChallengeResult(recordKey, points);
      onFinish({ points, correct, answered: number, maxCombo, completed: lives > 0, newHighScore, best });
      return;
    }
    setQuestion(nextQuestion(pool, question.item));
    setNumber((n) => n + 1);
    setAnswer(null);
  }

  function choiceClass(choice: string): string {
    if (!answered) return 'choice';
    if (choice === question.item.name) return 'choice correct';
    if (choice === answer.choice) return 'choice wrong';
    return 'choice';
  }

  return (
    <main className="page quiz">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>チャレンジモード</h1>

      {!playing ? (
        <div key={countdown} className="countdown" aria-live="assertive">{countdown}</div>
      ) : (
        <>
          <div className="quiz-hud">
            <span className="hearts" aria-label={`ライフ残り ${lives}`}>
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span key={i} className={i < lives ? 'heart' : 'heart lost'}>♥</span>
              ))}
            </span>
            <span className="muted">{number} / {MAX_QUESTIONS} 問目</span>
            <span className="quiz-points">
              {points.toLocaleString('ja-JP')} pt
              {answered && answer.points > 0 && <span key={number} className="points-pop">+{answer.points}</span>}
            </span>
          </div>
          <div className="combo-row">{combo >= 2 && <span className="combo">{combo} コンボ！</span>}</div>
          <TimerBar remainingMs={remainingMs} />
          <ChordDiagram chord={question.item.voicing} showNotes={answered} />
          <div className="choices">
            {question.choices.map((choice) => (
              <button key={choice} className={choiceClass(choice)} disabled={answered} onClick={() => resolve(choice)}>
                {choice}
              </button>
            ))}
          </div>
          {answered && (
            <>
              <p className={isCorrect ? 'feedback correct' : 'feedback wrong'}>
                {isCorrect
                  ? `正解！ +${answer.points}pt`
                  : `${answer.choice === null ? '時間切れ' : '不正解'}… 正解は ${question.item.name}（${question.item.voicing.label}）`}
              </p>
              {!isCorrect && (
                <div className="actions" style={{ justifyContent: 'center' }}>
                  <button className="button" onClick={next}>
                    {isFinished(lives, number) ? '結果を見る' : '次へ'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
