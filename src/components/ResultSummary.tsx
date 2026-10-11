import type { ReactNode } from 'react';
import { rankFor } from '../lib/scoring';

type Props = {
  /** カードの一番上に出す名前（例: 「Lv2 定番のバレー」）。カードだけでスクショしても何の結果かわかるようにする */
  title: string;
  description?: string;
  /** タイトルの下の小さなラベル（例: 「4択」「ゲームオーバー」） */
  heading: string;
  points: number;
  /** 称号を決めるための理論値 */
  maxPoints: number;
  newHighScore: boolean;
  stats: { label: string; value: string }[];
  actions: ReactNode;
};

/** クイズとチャレンジの結果を、ポイント・成績タイル・ボタンの順にまとめて見せる */
export default function ResultSummary({ title, description, heading, points, maxPoints, newHighScore, stats, actions }: Props) {
  return (
    <section className="result-card">
      <h2 className="result-title">{title}</h2>
      {description && <p className="muted result-description">{description}</p>}
      <p className="result-heading">{heading}</p>
      {newHighScore && (
        <div className="result-badges">
          <span className="high-score">ハイスコア更新！</span>
        </div>
      )}
      <p className="result-points">
        {points.toLocaleString('ja-JP')}
        <span className="result-points-unit">pt</span>
      </p>
      <p className="result-rank">
        称号 <strong>{rankFor(points, maxPoints)}</strong>
      </p>
      <dl className="result-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="result-stat">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="actions result-actions">{actions}</div>
    </section>
  );
}
