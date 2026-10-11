import type { ReactNode } from 'react';

type Props = {
  /** カードの一番上に出す名前（例: 「Lv2 定番のバレー」）。カードだけでスクショしても何の結果かわかるようにする */
  title: string;
  description?: string;
  /** タイトルの下の小さなラベル（例: 「4択」「ゲームオーバー」） */
  heading: string;
  points: number;
  newHighScore: boolean;
  /** 「クリア！」「100問完走！」のような達成バッジ */
  achievement?: string;
  stats: { label: string; value: string }[];
  actions: ReactNode;
};

/** クイズとチャレンジの結果を、ポイント・成績タイル・ボタンの順にまとめて見せる */
export default function ResultSummary({ title, description, heading, points, newHighScore, achievement, stats, actions }: Props) {
  return (
    <section className="result-card">
      <h2 className="result-title">{title}</h2>
      {description && <p className="muted result-description">{description}</p>}
      <p className="result-heading">{heading}</p>
      {(newHighScore || achievement) && (
        <div className="result-badges">
          {newHighScore && <span className="high-score">ハイスコア更新！</span>}
          {achievement && <span className="achievement">{achievement}</span>}
        </div>
      )}
      <p className="result-points">
        {points.toLocaleString('ja-JP')}
        <span className="result-points-unit">pt</span>
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
