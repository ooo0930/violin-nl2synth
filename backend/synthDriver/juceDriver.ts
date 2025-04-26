import { SynthDriver } from './synthDriver';
import { exec } from 'child_process';

export class JuceDriver implements SynthDriver {
  async play(params: any): Promise<void> {
    // 將 params 寫入暫存檔，並呼叫 synth.exe
    const fs = require('fs');
    fs.writeFileSync('temp_params.json', JSON.stringify(params));
    exec('../MFM-synth-juce-main/synth.exe temp_params.json');
  }
}
