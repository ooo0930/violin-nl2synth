export interface Translator {
  translate(text: string): Promise<ViolinPhrase[]>;
}

export interface ViolinPhrase {
  pitch: number;
  duration: number;
  velocity: number;
}
