import { useEffect, useRef } from 'react';
import type { Level } from '../model';
import { LEVEL_INFO } from '../data/chords';
import { MODE_LABELS, type QuizMode } from '../lib/quiz';
import { formatRoute, quizRoute } from '../lib/route';
import { loadProgress } from '../lib/progress';

const MODE_DESCRIPTIONS: Record<QuizMode, string> = {
  choice: '形を見て、コード名を選ぶ',
  build: '形を見て、ルート音とコードを順に選ぶ',
  shape: 'コード名を見て、押さえ方を選ぶ',
};
const MODES: QuizMode[] = ['choice', 'build', 'shape'];

type Props = {
  /** null のときは閉じる */
  level: Level | null;
  onClose: () => void;
};

/** レベルのクイズを始める前に、答え方（モード）を選ぶ */
export default function QuizModeDialog({ level, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (level !== null && !element.open) element.showModal();
    if (level === null && element.open) element.close();
  }, [level]);

  return (
    <dialog
      ref={dialog}
      className="mode-dialog"
      aria-labelledby="mode-dialog-title"
      onClose={onClose}
      // 背景（ダイアログの外側）をクリックしたら閉じる
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button className="dialog-close" aria-label="閉じる" onClick={onClose}>×</button>
      {level !== null && (
        <div className="mode-dialog-body">
          <h2 id="mode-dialog-title">Lv{level} {LEVEL_INFO[level].title}</h2>
          <p className="muted">クイズのモードを選んでください</p>
          <div className="mode-options">
            {MODES.map((mode) => {
              const best = loadProgress(undefined, mode)[level]?.bestPoints;
              return (
                <a key={mode} className="mode-option" href={formatRoute(quizRoute(level, mode))}>
                  <span className="mode-option-title">{MODE_LABELS[mode]}</span>
                  <span className="muted">{MODE_DESCRIPTIONS[mode]}</span>
                  <span className="mode-option-record">
                    {best === undefined ? '未挑戦' : `ハイスコア ${best.toLocaleString('ja-JP')}pt`}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </dialog>
  );
}
