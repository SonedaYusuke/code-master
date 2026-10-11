import { useEffect, useRef } from 'react';
import { MAX_LIVES, MAX_QUESTIONS } from '../lib/challenge';
import { QUESTION_COUNT } from '../lib/quiz';
import { BASE_POINTS, COMBO_STEP, MAX_COMBO_BONUS, MAX_TIME_BONUS, TIME_LIMIT_MS } from '../lib/scoring';

type Props = { open: boolean; onClose: () => void };

/** クイズの点数の付け方とルールの説明 */
export default function RulesDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="mode-dialog"
      aria-labelledby="rules-dialog-title"
      onClose={onClose}
      // 背景（ダイアログの外側）をクリックしたら閉じる
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mode-dialog-body rules">
        <h2 id="rules-dialog-title">遊び方</h2>
        <h3>点数</h3>
        <p className="muted">1問ごとの制限時間は {TIME_LIMIT_MS / 1000} 秒。正解すると次の合計がもらえます。</p>
        <ul>
          <li>正解: {BASE_POINTS}pt</li>
          <li>時間ボーナス: 残り時間に応じて最大 {MAX_TIME_BONUS}pt</li>
          <li>コンボボーナス: 2問連続正解から1問ごとに +{COMBO_STEP}pt（最大 {MAX_COMBO_BONUS}pt）</li>
        </ul>
        <p className="muted">不正解か時間切れは 0pt で、コンボも途切れます。</p>
        <h3>レベルのクイズ</h3>
        <ul>
          <li>{QUESTION_COUNT} 問出題</li>
          <li>ハイスコアは答え方ごとに記録</li>
        </ul>
        <h3>チャレンジモード</h3>
        <ul>
          <li>ライフは {MAX_LIVES} つ。不正解か時間切れで1つ減る</li>
          <li>ライフがなくなるか、{MAX_QUESTIONS} 問答えたら終了</li>
          <li>ハイスコアは選んだコードと答え方の組み合わせごとに記録</li>
        </ul>
        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button className="button secondary" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </dialog>
  );
}
