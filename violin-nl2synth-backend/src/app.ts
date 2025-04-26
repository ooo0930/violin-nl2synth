import express from 'express';
import dotenv from 'dotenv';
import Ajv from 'ajv';
import fs from 'fs';
import { llmTranslateWithRetry } from './llmTranslator';
import { validateAndFillSynthParams } from './paramMapper';
import { playSynthFromJson } from './synthDriver';
import { logger } from './logger';
import { mapToSynthFormat } from './synthMapper';
import { generateViolinMidi } from './midiGenerator';
import path from 'path';

dotenv.config();
const app = express();
app.use(express.json());

const ajv = new Ajv();
import synthParamSchema from './config/synthParamSchema.json';

// ====== 合成器路徑健全性檢查 ======
function checkSynthExecutable() {
  const synthPath = process.env.SYNTH_PATH;
  if (!synthPath || !fs.existsSync(synthPath)) {
    console.error(`[啟動失敗] 未找到合成器執行檔於 SYNTH_PATH: ${synthPath}`);
    process.exit(1);
  }
  if (!fs.statSync(synthPath).isFile()) {
    console.error(`[啟動失敗] SYNTH_PATH 指向的不是檔案: ${synthPath}`);
    process.exit(1);
  }
  try {
    fs.accessSync(synthPath, fs.constants.X_OK);
  } catch {
    console.error(`[啟動失敗] 合成器執行檔無執行權限: ${synthPath}`);
    process.exit(1);
  }
}

checkSynthExecutable();

app.post('/translate', async (req, res) => {
  try {
    const notes = await llmTranslateWithRetry(req.body.description, 3, [{ pitch: 60, duration: 1, velocity: 80 }]);
    res.json(notes);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'LLM 轉譯失敗' });
  }
});

app.post('/parametrize', (req, res) => {
  try {
    const params = validateAndFillSynthParams(req.body);
    res.json(params);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error(e);
    res.status(400).json({ error: '參數驗證失敗', detail: errMsg });
  }
});

app.post('/play', async (req, res) => {
  try {
    const tempPath = './temp_params.json';
    // 將參數轉換為合成器格式
    const synthParams = mapToSynthFormat(req.body);
    fs.writeFileSync(tempPath, JSON.stringify(synthParams));
    await playSynthFromJson(tempPath);
    res.json({ status: 'playing' });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error(e);
    res.status(500).json({ error: '合成器執行失敗', detail: errMsg });
  }
});

// ====== 批次 note 支援 ======
// playSynthFromJson 支援陣列格式
// (需同步升級 C++ play() 支援多音)

app.post('/midi', async (req, res) => {
  try {
    // 假設 params 來自 req.body 或自動產生一段四小節旋律（範例）
    const params = req.body?.params || [
      { pitch: 69, duration: 1, velocity: 80 }, // A4
      { pitch: 71, duration: 1, velocity: 80 }, // B4
      { pitch: 72, duration: 2, velocity: 90 }, // C5
      { pitch: 74, duration: 1, velocity: 85 }, // D5
      { pitch: 76, duration: 1, velocity: 85 }, // E5
      { pitch: 77, duration: 2, velocity: 90 }, // F5
      { pitch: 74, duration: 2, velocity: 80 }, // D5
      { pitch: 72, duration: 2, velocity: 80 }, // C5
    ];
    const outPath = path.join(__dirname, '../public/violin_sample.mid');
    await generateViolinMidi(params, outPath);
    res.json({ url: '/violin_sample.mid' });
  } catch (e) {
    res.status(500).json({ error: 'MIDI 產生失敗', detail: typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : String(e) });
  }
});

// 靜態服務 public 目錄，提供 midi 檔案下載
app.use(express.static(path.join(__dirname, '../public')));

export default app;
