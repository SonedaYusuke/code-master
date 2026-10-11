import { useState } from 'react';
import type { Chord, Level } from '../model';
import { CHORDS, LEVEL_INFO, chordsOfLevel } from '../data/chords';
import { generateQuiz, scorePercent, type QuizResult } from '../lib/quiz';
import { saveResult } from '../lib/progress';
import { formatRoute } from '../lib/route';
import ChordDiagram from '../components/ChordDiagram';

type Props = { level: Level; onFinish: (result: QuizResult) => void };

export default function Quiz({ level, onFinish }: Props) {
  const [questions] = useState(() => generateQuiz(chordsOfLevel(level), CHORDS));
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<Chord[]>([]);

  const question = questions[index];
  const answered = selectedId !== null;
  const isCorrect = selectedId === question.answer.id;

  function choose(choice: Chord) {
    if (answered) return;
    setSelectedId(choice.id);
    if (choice.id === question.answer.id) {
      setCorrect((n) => n + 1);
    } else {
      setWrong((list) => (list.some((c) => c.id === question.answer.id) ? list : [...list, question.answer]));
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelectedId(null);
      return;
    }
    const score = scorePercent(correct, questions.length);
    saveResult(level, score);
    onFinish({ level, score, correct, total: questions.length, wrong });
  }

  function choiceClass(choice: Chord): string {
    if (!answered) return 'choice';
    if (choice.id === question.answer.id) return 'choice correct';
    if (choice.id === selectedId) return 'choice wrong';
    return 'choice';
  }

  return (
    <main className="page quiz">
      <a className="back" href={formatRoute({ page: 'home' })}>← ホーム</a>
      <h1>Lv{level} {LEVEL_INFO[level].title}</h1>
      <p className="muted">{index + 1} / {questions.length} 問目</p>
      <ChordDiagram chord={question.answer} showNotes={answered} />
      <div className="choices">
        {question.choices.map((choice) => (
          <button key={choice.id} className={choiceClass(choice)} disabled={answered} onClick={() => choose(choice)}>
            {choice.name}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <p className={isCorrect ? 'feedback correct' : 'feedback wrong'}>
            {isCorrect ? '正解！' : `不正解… 正解は ${question.answer.name}`}
          </p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <button className="button" onClick={next}>
              {index + 1 < questions.length ? '次へ' : '結果を見る'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
