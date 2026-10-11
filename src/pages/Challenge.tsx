import { useEffect, useMemo, useState } from 'react';
import type { Note } from '../model';
import { CHART_TYPES, CHART_TYPE_LABELS, type ChartType } from '../data/chart';
import {
  MAX_LIVES,
  MAX_QUESTIONS,
  buildPool,
  buildShapeChoices,
  isFinished,
  nextQuestion,
  type ChallengeItem,
} from '../lib/challenge';
import { challengeRecordKey, loadChallengeBest, saveChallengeResult, selectionKey } from '../lib/challengeRecord';
import { buildQuestion } from '../lib/buildQuestion';
import { MODE_LABELS, type QuizMode } from '../lib/quiz';
import { pointsFor, timeLimitFor } from '../lib/scoring';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';
import TimerBar from '../components/TimerBar';
import BuildAnswer from '../components/BuildAnswer';
import ShapeAnswer from '../components/ShapeAnswer';
import ResultSummary from '../components/ResultSummary';
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
  const [mode, setMode] = useState<QuizMode>('choice');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [run, setRun] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const pool = useMemo(() => buildPool(types), [types]);
  const recordKey = challengeRecordKey(types, mode);
  const poolTypes = CHART_TYPES.filter((type) => types.has(type));

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

  if (phase === 'playing') {
    return <ChallengeGame key={run} pool={pool} poolTypes={poolTypes} mode={mode} recordKey={recordKey} onFinish={finish} />;
  }

  return (
    <main className="page">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>チャレンジモード</h1>

      {phase === 'result' && summary ? (
        <ResultSummary
          title="チャレンジモード"
          description={`${MODE_LABELS[mode]} / 出題コード: ${selectionKey(types)}`}
          heading={summary.completed ? 'クリア' : 'ゲームオーバー'}
          points={summary.points}
          newHighScore={summary.newHighScore}
          achievement={summary.completed ? `${MAX_QUESTIONS}問完走！` : undefined}
          stats={[
            { label: '正解', value: `${summary.correct} / ${summary.answered}` },
            { label: '最大コンボ', value: `${summary.maxCombo}` },
            { label: 'ハイスコア', value: `${summary.best.toLocaleString('ja-JP')}pt` },
          ]}
          actions={
            <>
              <button className="button" onClick={start}>もう一度</button>
              <button className="button secondary" onClick={() => setPhase('setup')}>コードを選び直す</button>
            </>
          }
        />
      ) : (
        <section>
          <p className="muted">
            選んだコードからランダムに出題します。ライフは {MAX_LIVES} つで、不正解か時間切れで1つ減ります。最大 {MAX_QUESTIONS} 問。
          </p>
          <h2 style={{ marginTop: 20 }}>答え方</h2>
          <div className="mode-toggle" role="group" aria-label="答え方">
            {(Object.keys(MODE_LABELS) as QuizMode[]).map((m) => (
              <button key={m} className={mode === m ? 'chip selected' : 'chip'} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <h2 style={{ marginTop: 20 }}>出題するコード</h2>
          <div className="type-picker" role="group" aria-label="出題するコード">
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

type GameProps = {
  pool: ChallengeItem[];
  poolTypes: ChartType[];
  mode: QuizMode;
  recordKey: string;
  onFinish: (summary: Summary) => void;
};

/** 回答結果。choice / pickedType が null なら時間切れ */
type Answer = { correct: boolean; timedOut: boolean; points: number; choice: string | null; pickedType: ChartType | null };

function createQuestion(pool: ChallengeItem[], poolTypes: ChartType[], previous: ChallengeItem | null) {
  const question = nextQuestion(pool, previous);
  const { root, type } = question.item;
  return {
    ...question,
    build: buildQuestion({ root, type, preferFlat: false }, poolTypes),
    shapes: buildShapeChoices(question.item, new Set(poolTypes)).map((choice) => ({ ...choice.voicing, name: choice.name })),
  };
}

function ChallengeGame({ pool, poolTypes, mode, recordKey, onFinish }: GameProps) {
  const countdown = useCountdown();
  const [question, setQuestion] = useState(() => createQuestion(pool, poolTypes, null));
  const [number, setNumber] = useState(1);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pickedRoot, setPickedRoot] = useState<Note | null>(null);
  const [lives, setLives] = useState(MAX_LIVES);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);

  const timeLimitMs = timeLimitFor(mode);
  const playing = countdown <= 0;
  const answered = answer !== null;
  const isCorrect = answer?.correct ?? false;
  const { remainingMs, stop } = useQuestionTimer(
    playing && !answered,
    number,
    () => resolve(false, { choice: null, pickedType: null }),
    timeLimitMs,
  );

  // 正解したら少し待って自動で次へ
  useEffect(() => {
    if (!answered || !isCorrect) return;
    const timer = setTimeout(next, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [answered, isCorrect]);

  function resolve(right: boolean, picks: Pick<Answer, 'choice' | 'pickedType'>) {
    if (answered) return;
    const remaining = stop();
    const nextCombo = right ? combo + 1 : 0;
    const gained = pointsFor(right, remaining, nextCombo, timeLimitMs);
    setAnswer({ correct: right, timedOut: remaining <= 0, points: gained, ...picks });
    setPoints((p) => p + gained);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    if (right) setCorrect((n) => n + 1);
    else setLives((n) => n - 1);
  }

  function pickType(type: ChartType) {
    const right = pickedRoot === question.build.root && type === question.build.type;
    resolve(right, { choice: null, pickedType: type });
  }

  function next() {
    if (isFinished(lives, number)) {
      const { best, newHighScore } = saveChallengeResult(recordKey, points);
      onFinish({ points, correct, answered: number, maxCombo, completed: lives > 0, newHighScore, best });
      return;
    }
    setQuestion(createQuestion(pool, poolTypes, question.item));
    setNumber((n) => n + 1);
    setAnswer(null);
    setPickedRoot(null);
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
      <p className="muted">{MODE_LABELS[mode]}</p>

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
          <TimerBar remainingMs={remainingMs} timeLimitMs={timeLimitMs} />
          {mode === 'shape' ? (
            <p className="shape-target">{question.item.name}</p>
          ) : (
            <ChordDiagram chord={question.item.voicing} showNotes={answered} />
          )}
          {mode === 'shape' ? (
            <ShapeAnswer
              choices={question.shapes}
              answerId={question.item.voicing.id}
              pickedId={answer?.choice ?? null}
              answered={answered}
              onPick={(id) => resolve(id === question.item.voicing.id, { choice: id, pickedType: null })}
            />
          ) : mode === 'choice' ? (
            <div className="choices">
              {question.choices.map((choice) => (
                <button
                  key={choice}
                  className={choiceClass(choice)}
                  disabled={answered}
                  onClick={() => resolve(choice === question.item.name, { choice, pickedType: null })}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <BuildAnswer
              question={question.build}
              pickedRoot={pickedRoot}
              pickedType={answer?.pickedType ?? null}
              answered={answered}
              onPickRoot={setPickedRoot}
              onPickType={pickType}
            />
          )}
          {answered && (
            <>
              <p className={isCorrect ? 'feedback correct' : 'feedback wrong'}>
                {isCorrect
                  ? `正解！ +${answer.points}pt`
                  : `${answer.timedOut ? '時間切れ' : '不正解'}… 正解は ${question.item.name}（${question.item.voicing.label}）`}
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
