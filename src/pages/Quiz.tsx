import { useEffect, useState } from 'react';
import type { Chord, Level } from '../model';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { generateQuiz, scorePercent, type QuizResult } from '../lib/quiz';
import { pointsFor } from '../lib/scoring';
import { saveResult } from '../lib/progress';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';
import TimerBar from '../components/TimerBar';
import { useCountdown } from '../hooks/useCountdown';
import { useQuestionTimer } from '../hooks/useQuestionTimer';

type Props = { level: Level; onFinish: (result: QuizResult) => void };

/** 回答結果。choiceId が null なら時間切れ */
type Answer = { choiceId: string | null; points: number };

export default function Quiz({ level, onFinish }: Props) {
  const [questions] = useState(() => generateQuiz(chordsOfLevel(level), CHORDS));
  const countdown = useCountdown();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<Chord[]>([]);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const question = questions[index];
  const playing = countdown <= 0;
  const answered = answer !== null;
  const isCorrect = answer?.choiceId === question.answer.id;
  const { remainingMs, stop } = useQuestionTimer(playing && !answered, index);

  useEffect(() => {
    if (playing && !answered && remainingMs <= 0) resolve(null);
  }, [playing, answered, remainingMs]);

  function resolve(choiceId: string | null) {
    if (answered) return;
    const remaining = stop();
    const right = choiceId === question.answer.id;
    const nextCombo = right ? combo + 1 : 0;
    const gained = pointsFor(right, remaining, nextCombo);
    setAnswer({ choiceId, points: gained });
    setPoints((p) => p + gained);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    if (right) {
      setCorrect((n) => n + 1);
    } else {
      setWrong((list) => (list.some((c) => c.id === question.answer.id) ? list : [...list, question.answer]));
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer(null);
      return;
    }
    const score = scorePercent(correct, questions.length);
    const { newHighScore } = saveResult(level, { score, points });
    onFinish({ level, score, points, maxCombo, newHighScore, correct, total: questions.length, wrong });
  }

  function choiceClass(choice: Chord): string {
    if (!answered) return 'choice';
    if (choice.id === question.answer.id) return 'choice correct';
    if (choice.id === answer.choiceId) return 'choice wrong';
    return 'choice';
  }

  function feedback(): string {
    if (isCorrect) return `正解！ +${answer!.points}pt`;
    if (answer?.choiceId === null) return `時間切れ… 正解は ${question.answer.name}`;
    return `不正解… 正解は ${question.answer.name}`;
  }

  return (
    <main className="page quiz">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>

      {!playing ? (
        <div key={countdown} className="countdown" aria-live="assertive">{countdown}</div>
      ) : (
        <>
          <div className="quiz-hud">
            <span className="muted">{index + 1} / {questions.length} 問目</span>
            <span className="quiz-points">
              {points.toLocaleString('ja-JP')} pt
              {answered && answer.points > 0 && (
                <span key={index} className="points-pop">+{answer.points}</span>
              )}
            </span>
          </div>
          <div className="combo-row">{combo >= 2 && <span className="combo">{combo} コンボ！</span>}</div>
          <TimerBar remainingMs={remainingMs} />
          <ChordDiagram chord={question.answer} showNotes={answered} />
          <div className="choices">
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                className={choiceClass(choice)}
                disabled={answered}
                onClick={() => resolve(choice.id)}
              >
                {choice.name}
              </button>
            ))}
          </div>
          {answered && (
            <>
              <p className={isCorrect ? 'feedback correct' : 'feedback wrong'}>{feedback()}</p>
              <div className="actions" style={{ justifyContent: 'center' }}>
                <button className="button" onClick={next}>
                  {index + 1 < questions.length ? '次へ' : '結果を見る'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
