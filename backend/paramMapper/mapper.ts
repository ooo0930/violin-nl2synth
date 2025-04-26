import { ViolinPhrase } from '../translator/translator';

export interface SynthParam {
  pitch: number;
  duration: number;
  intensity: number;
  bowPosition: number;
  vibrato: number;
}

export function mapToSynthParams(notes: ViolinPhrase[], config: any): SynthParam[] {
  return notes.map(note => ({
    pitch: note.pitch,
    duration: note.duration,
    intensity: note.velocity / 127,
    bowPosition: config.defaultBowPosition,
    vibrato: config.defaultVibrato
  }));
}
