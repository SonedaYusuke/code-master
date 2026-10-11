import type { Note } from '../model';
import { CHART_TYPE_LABELS, type ChartType } from '../data/chart';
import { displayRoot, type BuildQuestion } from '../lib/buildQuestion';

type Props = {
  question: BuildQuestion;
  pickedRoot: Note | null;
  /** 回答後だけ使う。null なら時間切れ */
  pickedType: ChartType | null;
  answered: boolean;
  onPickRoot: (root: Note) => void;
  onPickType: (type: ChartType) => void;
};

/** ルート4択 → タイプ4択の2段階で答える。ルートはタイプを選ぶまで選び直せる */
export default function BuildAnswer({ question, pickedRoot, pickedType, answered, onPickRoot, onPickType }: Props) {
  function className<T>(value: T, correct: T, picked: T | null): string {
    if (answered) {
      if (value === correct) return 'choice correct';
      if (value === picked) return 'choice wrong';
      return 'choice';
    }
    return value === picked ? 'choice picked' : 'choice';
  }

  return (
    <>
      <p className="build-step">① ルート音</p>
      <div className="choices">
        {question.rootChoices.map((root) => (
          <button
            key={root}
            className={className(root, question.root, pickedRoot)}
            disabled={answered}
            onClick={() => onPickRoot(root)}
          >
            {displayRoot(root, question.preferFlat)}
          </button>
        ))}
      </div>
      <p className="build-step">② コード</p>
      <div className="choices">
        {question.typeChoices.map((type) => (
          <button
            key={type}
            className={className(type, question.type, pickedType)}
            disabled={answered || pickedRoot === null}
            onClick={() => onPickType(type)}
          >
            {CHART_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </>
  );
}
