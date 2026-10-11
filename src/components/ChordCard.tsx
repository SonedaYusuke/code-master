import type { ChordShape as Chord } from '../model';
import { chordTones } from '../lib/notes';
import ChordDiagram from './ChordDiagram';

export default function ChordCard({ chord }: { chord: Chord }) {
  return (
    <section className="chord-card">
      <h2>{chord.name}</h2>
      <ChordDiagram chord={chord} showNotes />
      <p>構成音: {chordTones(chord).join('・')}</p>
    </section>
  );
}
