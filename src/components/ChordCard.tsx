import type { ChordShape } from '../model';
import { chordTones } from '../lib/notes';
import ChordDiagram from './ChordDiagram';

export default function ChordCard({ chord }: { chord: ChordShape & { simplified?: true } }) {
  return (
    <section className="chord-card">
      <h2>
        {chord.name}
        {chord.simplified && <span className="freq-badge simplified">省略</span>}
      </h2>
      <ChordDiagram chord={chord} showNotes />
      <p>構成音: {chordTones(chord).join('・')}</p>
    </section>
  );
}
