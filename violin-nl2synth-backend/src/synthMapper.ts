// synthMapper.ts
// 將 NL2Synth json 轉換為 MFM-synth-juce-main 可用格式

/**
 * 預設對應表：
 * NL2Synth 欄位      MFM-synth-juce 欄位
 * pitch             pitch
 * duration          duration
 * velocity          velocity
 * intensity         intensity
 * bowPosition       articulation
 * vibrato           vibrato
 * articulation      resonance/sharpness（依音色自動對應）
 */

import Ajv from 'ajv';
const ajv = new Ajv();
import synthParamSchema from './config/synthParamSchema.json';
import synthParamDictionary from './config/synthParamDictionary.json';

// ====== 參數驗證與 fallback ======
function validateSynthParams(params: any) {
  const valid = ajv.validate(synthParamSchema, params);
  if (!valid) {
    console.warn('[參數驗證失敗] 使用預設參數:', ajv.errors);
    return [{ pitch: 60, duration: 1, velocity: 80 }];
  }
  return params;
}

// 新增：自然語言描述 → 合成器參數 mapping
export function mapDescriptionToSynthParams(description: string): any {
  // 基本規則：根據描述關鍵詞調整參數，否則用預設
  const dict = synthParamDictionary as Record<string, any>;
  const params: Record<string, number> = {};
  for (const key in dict) {
    params[key] = dict[key].default;
  }
  // 關鍵字範例（可擴充）
  if (/激烈|強烈|激昂/.test(description)) {
    params.intensity = 0.95;
    params.gain = 0.95;
    params.vibrato = 0.7;
    params.articulation = 0.8;
  }
  if (/柔和|溫柔|抒情/.test(description)) {
    params.intensity = 0.5;
    params.gain = 0.6;
    params.vibrato = 0.2;
    params.articulation = 0.2;
  }
  if (/顫音|顫抖/.test(description)) {
    params.vibrato = 0.9;
  }
  if (/明亮|清澈/.test(description)) {
    params.sharpness = 0.9;
    params.resonance = 0.7;
  }
  if (/暗|厚重/.test(description)) {
    params.sharpness = 0.2;
    params.resonance = 0.9;
  }
  // ...可根據實際需求擴充
  return params;
}

export function mapToSynthFormat(nl2synthParams: any): any {
  // 支援單一物件或陣列
  const checked = validateSynthParams(nl2synthParams);
  const items = Array.isArray(checked) ? checked : [checked];
  return items.map(note => ({
    pitch: note.pitch,
    velocity: note.velocity,
    duration: note.duration,
    gain: note.intensity ?? 1.0,
    bowPosition: note.bowPosition ?? 70.0,
    vibrato: note.vibrato ?? 0.42,
    resonance: note.articulation === 'legato' ? 0.8 : 0.5,
    sharpness: note.articulation === 'staccato' ? 0.8 : 0.5,
    wetDry: 0.5,
    attack: 1.0,
    loopStart: 0.5,
    loopEnd: 1.0,
    pitchVariance: 0.0
  }));
}
