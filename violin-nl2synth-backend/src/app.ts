import express from 'express';
import dotenv from 'dotenv';
import Ajv from 'ajv';
import fs from 'fs';
import { llmTranslateWithRetry } from './llmTranslator';
import { validateAndFillSynthParams } from './paramMapper';
import { playSynthFromJson } from './synthDriver';
import { logger } from './logger';
import { mapToSynthFormat } from './synthMapper';

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

app.listen(3000, () => logger.info('Backend API listening on port 3000'));

export default app;
