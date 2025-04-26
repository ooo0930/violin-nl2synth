export interface SynthDriver {
  play(params: any): Promise<void>;
}
