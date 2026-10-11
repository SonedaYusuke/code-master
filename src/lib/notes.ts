import { NOTES, type ChordShape as Chord, type Note } from '../model';

const OPEN_STRINGS: readonly Note[] = ['E', 'A', 'D', 'G', 'B', 'E'];

function noteAt(openNote: Note, fret: number): Note {
  return NOTES[(NOTES.indexOf(openNote) + fret) % 12];
}

function intervalFrom(root: Note, note: Note): number {
  return (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12;
}

export function stringNotes(chord: Chord): (Note | null)[] {
  return chord.frets.map((fret, i) => (fret === null ? null : noteAt(OPEN_STRINGS[i], fret)));
}

export function rootNote(chord: Chord): Note {
  const root = stringNotes(chord).find((note): note is Note => note !== null);
  if (!root) throw new Error(`${chord.id} に鳴っている弦がありません`);
  return root;
}

/** 重複を除き、ルートからの音程順に並べる */
export function sortFromRoot(root: Note, notes: readonly Note[]): Note[] {
  return [...new Set(notes)].sort((a, b) => intervalFrom(root, a) - intervalFrom(root, b));
}

export function chordTones(chord: Chord): Note[] {
  return sortFromRoot(rootNote(chord), stringNotes(chord).filter((note): note is Note => note !== null));
}
