import { Midi } from '@tonejs/midi';
import fs from 'fs';

// params: array of note objects, e.g. [{ pitch: 69, duration: 1, velocity: 60 }, ...]
export async function generateViolinMidi(params: any[], outPath: string) {
  const midi = new Midi();
  const track = midi.addTrack();
  let time = 0;
  for (const note of params) {
    // MIDI note numbers: 69 = A4, etc.
    track.addNote({
      midi: note.pitch,
      time,
      duration: note.duration,
      velocity: (note.velocity || 80) / 127,
      // channel: 0 // 註解掉，@tonejs/midi NoteConstructorInterface 不支援 channel 屬性
    });
    time += note.duration;
  }
  // Export to file
  const midiData = midi.toArray();
  fs.writeFileSync(outPath, Buffer.from(midiData));
}
