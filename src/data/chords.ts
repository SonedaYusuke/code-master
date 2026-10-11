import type { Chord, Level } from '../model';
import { CHART, type VoicingLabel } from './chart';

export const LEVEL_INFO: Record<Level, { title: string; description: string }> = {
  1: { title: '必須コード', description: 'まず最初に覚えたい、開放弦を使った基本のコード。' },
  2: { title: '定番のバレー', description: '最初の壁の F と B から始めて、よく登場するバレーコードとその省略形を押さえます。' },
  3: { title: 'オープンの7th', description: '開放弦を使ったセブンスコード。ブルースやポップスでよく登場します。' },
  4: { title: 'M7・m7', description: 'オープンとバレー、省略形で、メジャーセブンスとマイナーセブンスを押さえます。' },
  5: { title: 'バレーの7th', description: '6弦・5弦ルートのバレーで、いろいろなキーのセブンスを押さえます。' },
  6: { title: 'sus・add9', description: '開放弦の形で覚える、浮遊感のある sus と add9。' },
  7: { title: '6・9 とバレーの sus・add9', description: '6th・9th と、バレーで押さえる sus・add9。' },
  8: { title: 'dim・aug 系', description: 'つなぎや緊張感を作る、ディミニッシュ・オーギュメント系のコード。' },
};

/** 早見表から選ぶ形。label を省くと一番低いポジションの形、name を省くと早見表の表記 */
type Pick = { chord: string; label?: VoicingLabel; name?: string };

const LEVEL_PICKS: Record<Level, Pick[]> = {
  1: [
    { chord: 'C' }, { chord: 'D' }, { chord: 'E' }, { chord: 'G' },
    { chord: 'A' }, { chord: 'Am' }, { chord: 'Dm' }, { chord: 'Em' },
  ],
  2: [
    { chord: 'F' }, { chord: 'F', label: '省略形' }, { chord: 'B' }, { chord: 'Bm' }, { chord: 'A#', name: 'B♭' },
    { chord: 'F#m' }, { chord: 'F#m', label: '省略形' },
    { chord: 'Cm' }, { chord: 'Gm' }, { chord: 'C#m' }, { chord: 'Fm' }, { chord: 'Fm', label: '省略形' },
    { chord: 'D#', label: '5弦ルート', name: 'E♭' }, { chord: 'G#', name: 'A♭' },
  ],
  3: [
    { chord: 'A7' }, { chord: 'B7' }, { chord: 'C7' }, { chord: 'D7' }, { chord: 'E7' },
    { chord: 'G7' }, { chord: 'Am7' }, { chord: 'Dm7' }, { chord: 'Em7' },
  ],
  4: [
    { chord: 'Cmaj7', label: 'オープン' },
    { chord: 'Dmaj7', label: 'オープン' },
    { chord: 'Gmaj7', label: 'オープン' },
    { chord: 'Amaj7', label: 'オープン' },
    { chord: 'Fmaj7', label: '6弦ルート' },
    { chord: 'Fmaj7', label: '省略形' },
    { chord: 'A#maj7', label: '5弦ルート', name: 'B♭M7' },
    { chord: 'F#m7', label: '6弦ルート' },
    { chord: 'F#m7', label: '省略形' },
    { chord: 'Gm7', label: '6弦ルート' },
    { chord: 'Bm7', label: '5弦ルート' },
    { chord: 'Bm7', label: '省略形' },
    { chord: 'Cm7', label: '5弦ルート' },
  ],
  5: [
    { chord: 'F7', label: '6弦ルート' },
    { chord: 'G7', label: '6弦ルート' },
    { chord: 'A7', label: '6弦ルート' },
    { chord: 'A#7', label: '5弦ルート', name: 'B♭7' },
    { chord: 'B7', label: '5弦ルート' },
    { chord: 'C7', label: '5弦ルート' },
    { chord: 'D7', label: '5弦ルート' },
    { chord: 'E7', label: '5弦ルート' },
  ],
  6: [
    { chord: 'Asus4', label: 'オープン' },
    { chord: 'Dsus4', label: 'オープン' },
    { chord: 'Esus4', label: 'オープン' },
    { chord: 'Csus4', label: 'オープン' },
    { chord: 'Asus2', label: 'オープン' },
    { chord: 'Dsus2', label: 'オープン' },
    { chord: 'Cadd9', label: 'オープン' },
    { chord: 'Gadd9', label: 'オープン' },
    { chord: 'Eadd9', label: 'オープン' },
    { chord: 'Aadd9', label: 'オープン' },
  ],
  7: [
    { chord: 'A6', label: 'オープン' },
    { chord: 'C6', label: '5弦ルート' },
    { chord: 'G6', label: '6弦ルート' },
    { chord: 'E9', label: 'オープン' },
    { chord: 'C9', label: '5弦ルート' },
    { chord: 'G9', label: '6弦ルート' },
    { chord: 'Gsus4', label: '6弦ルート' },
    { chord: 'Bsus4', label: '5弦ルート' },
    { chord: 'Fadd9', label: '6弦ルート' },
    { chord: 'Dadd9', label: '5弦ルート' },
  ],
  8: [
    { chord: 'Am7b5', label: 'オープン' },
    { chord: 'Bm7b5', label: '5弦ルート' },
    { chord: 'F#m7b5', label: '6弦ルート' },
    { chord: 'Bdim', label: '5弦ルート' },
    { chord: 'Cdim', label: '5弦ルート' },
    { chord: 'C#dim7', label: '5弦ルート' },
    { chord: 'Gdim7', label: '6弦ルート' },
    { chord: 'Edim7', label: '4弦ルート' },
    { chord: 'Caug', label: '5弦ルート' },
    { chord: 'Eaug', label: 'オープン' },
  ],
};

const CHART_CHORDS = new Map(CHART.flatMap((section) => section.chords).map((chord) => [chord.id, chord]));

function toChord(level: Level, { chord, label, name }: Pick): Chord {
  const chartChord = CHART_CHORDS.get(chord);
  if (!chartChord) throw new Error(`早見表に ${chord} がありません`);
  const voicing = label ? chartChord.voicings.find((v) => v.label === label) : chartChord.voicings[0];
  if (!voicing) throw new Error(`${chord} に ${label} の形がありません`);
  const { label: _label, frequency: _frequency, ...shape } = voicing;
  return { ...shape, name: name ?? voicing.name, level, ...(voicing.label === '省略形' && { simplified: true as const }) };
}

export const CHORDS: Chord[] = (Object.keys(LEVEL_PICKS).map(Number) as Level[]).flatMap((level) =>
  LEVEL_PICKS[level].map((pick) => toChord(level, pick)),
);

export function chordsOfLevel(level: Level): Chord[] {
  return CHORDS.filter((chord) => chord.level === level);
}
