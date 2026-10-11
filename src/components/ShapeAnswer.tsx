import type { ChordShape } from '../model';
import ChordDiagram from './ChordDiagram';

type Props = {
  choices: ChordShape[];
  answerId: string;
  /** 回答後だけ使う。null なら時間切れ */
  pickedId: string | null;
  answered: boolean;
  onPick: (id: string) => void;
};

/** 4つの押さえ方から選ぶ。答える前は音名とコード名を隠し、答えたあとに出す */
export default function ShapeAnswer({ choices, answerId, pickedId, answered, onPick }: Props) {
  function className(id: string): string {
    if (!answered) return 'choice shape-choice';
    if (id === answerId) return 'choice shape-choice correct';
    if (id === pickedId) return 'choice shape-choice wrong';
    return 'choice shape-choice';
  }

  return (
    <div className="choices">
      {choices.map((choice, i) => (
        <button
          key={choice.id}
          className={className(choice.id)}
          disabled={answered}
          aria-label={answered ? choice.name : `選択肢 ${i + 1}`}
          onClick={() => onPick(choice.id)}
        >
          <ChordDiagram chord={choice} showNotes={answered} />
          {answered && <span className="shape-choice-name">{choice.name}</span>}
        </button>
      ))}
    </div>
  );
}
