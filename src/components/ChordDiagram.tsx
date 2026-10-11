import type { ChordShape as Chord } from '../model';
import { stringNotes } from '../lib/notes';

const FRET_COUNT = 5;
const STRING_GAP = 24;
const FRET_GAP = 28;
/** 左は開始フレット（例: 10fr）を書くので右より広くとる */
const LEFT = 44;
const RIGHT = 28;
const TOP = 36;
const DOT_RADIUS = 9;
const WIDTH = LEFT + RIGHT + STRING_GAP * 5;
const BOARD_BOTTOM = TOP + FRET_GAP * FRET_COUNT;
const HEIGHT = BOARD_BOTTOM + 28;

/** i: 0 = 6弦 */
const stringX = (i: number) => LEFT + i * STRING_GAP;
/** 弦番号（6〜1）→ 配列 index */
const indexOfString = (stringNumber: number) => 6 - stringNumber;

type Props = { chord: Chord; showNotes: boolean };

export default function ChordDiagram({ chord, showNotes }: Props) {
  const baseFret = chord.baseFret ?? 1;
  const fretY = (fret: number) => TOP + (fret - baseFret + 0.5) * FRET_GAP;
  const notes = stringNotes(chord);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="chord-diagram"
      role="img"
      aria-label={showNotes ? `${chord.name} のダイアグラム` : 'コードダイアグラム'}
    >
      {Array.from({ length: FRET_COUNT + 1 }, (_, f) => (
        <line
          key={`fret-${f}`}
          x1={stringX(0)} x2={stringX(5)}
          y1={TOP + f * FRET_GAP} y2={TOP + f * FRET_GAP}
          className={f === 0 && baseFret === 1 ? 'nut' : 'fret'}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`string-${i}`} x1={stringX(i)} x2={stringX(i)} y1={TOP} y2={BOARD_BOTTOM} className="string" />
      ))}
      {baseFret > 1 && (
        <text x={LEFT - 8} y={fretY(baseFret)} className="base-fret" textAnchor="end" dominantBaseline="middle">
          {baseFret}fr
        </text>
      )}
      {chord.barre && (
        <rect
          x={stringX(indexOfString(chord.barre.fromString)) - DOT_RADIUS}
          y={fretY(chord.barre.fret) - DOT_RADIUS}
          width={stringX(indexOfString(chord.barre.toString)) - stringX(indexOfString(chord.barre.fromString)) + DOT_RADIUS * 2}
          height={DOT_RADIUS * 2}
          rx={DOT_RADIUS}
          className="barre"
        />
      )}
      {chord.frets.map((fret, i) => {
        if (fret === null || fret === 0) {
          return (
            <text key={`mark-${i}`} x={stringX(i)} y={TOP - 12} className="marker" textAnchor="middle">
              {fret === null ? '×' : '○'}
            </text>
          );
        }
        const finger = chord.fingers?.[i];
        return (
          <g key={`dot-${i}`}>
            <circle cx={stringX(i)} cy={fretY(fret)} r={DOT_RADIUS} className="dot" />
            {finger != null && (
              <text x={stringX(i)} y={fretY(fret)} className="finger" textAnchor="middle" dominantBaseline="central">
                {finger}
              </text>
            )}
          </g>
        );
      })}
      {showNotes &&
        notes.map((note, i) =>
          note === null ? null : (
            <text key={`note-${i}`} x={stringX(i)} y={BOARD_BOTTOM + 20} className="note" textAnchor="middle">
              {note}
            </text>
          ),
        )}
    </svg>
  );
}
