import { mapToSynthFormat } from '../src/synthMapper';

describe('mapToSynthFormat', () => {
  it('should map valid params to synth format', () => {
    const input = { pitch: 65, velocity: 0.9, duration: 2, articulation: 'legato' };
    const output = mapToSynthFormat(input);
    expect(output[0]).toMatchObject({
      pitch: 65,
      velocity: 0.9,
      duration: 2,
      resonance: 0.8,
      sharpness: 0.5
    });
  });

  it('should fallback to default if params invalid', () => {
    const input = { foo: 'bar' };
    const output = mapToSynthFormat(input);
    expect(output[0].pitch).toBe(60);
    expect(output[0].duration).toBe(1);
    expect(output[0].velocity).toBe(80);
  });

  it('should map array of notes', () => {
    const input = [
      { pitch: 60, velocity: 0.8, duration: 1 },
      { pitch: 62, velocity: 0.7, duration: 1.5 }
    ];
    const output = mapToSynthFormat(input);
    expect(output.length).toBe(2);
    expect(output[1].pitch).toBe(62);
  });
});
