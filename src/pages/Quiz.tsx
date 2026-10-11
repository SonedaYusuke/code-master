import { useEffect, useState } from 'react';
import type { Chord, Level, Note } from '../model';
import type { ChartType } from '../data/chart';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { MODE_LABELS, generateQuiz, scorePercent, type QuizMode, type QuizResult } from '../lib/quiz';
import { buildQuestion, rootAndType } from '../lib/buildQuestion';
import { pointsFor, timeLimitFor } from '../lib/scoring';
import { saveResult } from '../lib/progress';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';
import TimerBar from '../components/TimerBar';
import BuildAnswer from '../components/BuildAnswer';
import ShapeAnswer from '../components/ShapeAnswer';
import { useCountdown } from '../hooks/useCountdown';
import { useQuestionTimer } from '../hooks/useQuestionTimer';

type Props = { level: Level; mode: QuizMode; onFinish: (result: QuizResult) => void };

/** 正解したとき、次の問題へ自動で進むまでの待ち時間 */
const AUTO_NEXT_MS = 800;

/** 回答結果。choiceId / pickedType が null なら時間切れ */
type Answer = { correct: boolean; timedOut: boolean; points: number; choiceId: string | null; pickedType: ChartType | null };

function createQuestions(level: Level) {
  const levelChords = chordsOfLevel(level);
  const levelTypes = [...new Set(levelChords.map((chord) => rootAndType(chord).type))];
  return generateQuiz(levelChords, CHORDS).map((question) => ({
    ...question,
    build: buildQuestion(rootAndType(question.answer), levelTypes),
  }));
}

export default function Quiz({ level, mode, onFinish }: Props) {
  const [questions] = useState(() => createQuestions(level));
  const countdown = useCountdown();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pickedRoot, setPickedRoot] = useState<Note | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<Chord[]>([]);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const timeLimitMs = timeLimitFor(mode);
  const question = questions[index];
  const playing = countdown <= 0;
  const answered = answer !== null;
  const isCorrect = answer?.correct ?? false;
  const { remainingMs, stop } = useQuestionTimer(
    playing && !answered,
    index,
    () => resolve(false, { choiceId: null, pickedType: null }),
    timeLimitMs,
  );

  // 正解したら少し待って自動で次へ
  useEffect(() => {
    if (!answered || !isCorrect) return;
    const timer = setTimeout(next, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [answered, isCorrect]);

  function resolve(right: boolean, picks: Pick<Answer, 'choiceId' | 'pickedType'>) {
    if (answered) return;
    const remaining = stop();
    const nextCombo = right ? combo + 1 : 0;
    const gained = pointsFor(right, remaining, nextCombo, timeLimitMs);
    setAnswer({ correct: right, timedOut: remaining <= 0, points: gained, ...picks });
    setPoints((p) => p + gained);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    if (right) {
      setCorrect((n) => n + 1);
    } else {
      setWrong((list) => (list.some((c) => c.id === question.answer.id) ? list : [...list, question.answer]));
    }
  }

  function pickType(type: ChartType) {
    const right = pickedRoot === question.build.root && type === question.build.type;
    resolve(right, { choiceId: null, pickedType: type });
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer(null);
      setPickedRoot(null);
      return;
    }
    const score = scorePercent(correct, questions.length);
    const { newHighScore } = saveResult(level, { score, points }, undefined, mode);
    onFinish({ level, mode, score, points, maxCombo, newHighScore, correct, total: questions.length, wrong });
  }

  function choiceClass(choice: Chord): string {
    if (!answered) return 'choice';
    if (choice.id === question.answer.id) return 'choice correct';
    if (choice.id === answer.choiceId) return 'choice wrong';
    return 'choice';
  }

  function feedback(): string {
    if (answer!.correct) return `正解！ +${answer!.points}pt`;
    return `${answer!.timedOut ? '時間切れ' : '不正解'}… 正解は ${question.answer.name}`;
  }

  return (
    <main className="page quiz">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{MODE_LABELS[mode]}</p>

      {!playing ? (
        <div key={countdown} className="countdown" aria-live="assertive">{countdown}</div>
      ) : (
        <>
          <div className="quiz-hud">
            <span className="muted">{index + 1} / {questions.length} 問目</span>
            <span className="quiz-points">
              {points.toLocaleString('ja-JP')} pt
              {answered && answer.points > 0 && <span key={index} className="points-pop">+{answer.points}</span>}
            </span>
          </div>
          <div className="combo-row">{combo >= 2 && <span className="combo">{combo} コンボ！</span>}</div>
          <TimerBar remainingMs={remainingMs} timeLimitMs={timeLimitMs} />
          {mode === 'shape' ? (
            <p className="shape-target">{question.answer.name}</p>
          ) : (
            <ChordDiagram chord={question.answer} showNotes={answered} />
          )}
          {mode === 'shape' ? (
            <ShapeAnswer
              choices={question.choices}
              answerId={question.answer.id}
              pickedId={answer?.choiceId ?? null}
              answered={answered}
              onPick={(id) => resolve(id === question.answer.id, { choiceId: id, pickedType: null })}
            />
          ) : mode === 'choice' ? (
            <div className="choices">
              {question.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={choiceClass(choice)}
                  disabled={answered}
                  onClick={() => resolve(choice.id === question.answer.id, { choiceId: choice.id, pickedType: null })}
                >
                  {choice.name}
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
              <p className={answer.correct ? 'feedback correct' : 'feedback wrong'}>{feedback()}</p>
              {!isCorrect && (
                <div className="actions" style={{ justifyContent: 'center' }}>
                  <button className="button" onClick={next}>
                    {index + 1 < questions.length ? '次へ' : '結果を見る'}
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
