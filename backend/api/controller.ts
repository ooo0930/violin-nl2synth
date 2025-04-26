import { GptTranslator } from '../translator/gptTranslator';
import { mapToSynthParams } from '../paramMapper/mapper';
import { JuceDriver } from '../synthDriver/juceDriver';
import config from '../../config/default.json';
import { logger } from '../utils/logger';

export async function translateController(req, res) {
  try {
    const translator = new GptTranslator();
    const notes = await translator.translate(req.body.description);
    res.json(notes);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'LLM 轉譯失敗' });
  }
}

export async function parametrizeController(req, res) {
  try {
    const params = mapToSynthParams(req.body, config);
    res.json(params);
  } catch (e) {
    logger.error(e);
    res.status(400).json({ error: '參數化失敗' });
  }
}

export async function playController(req, res) {
  try {
    const driver = new JuceDriver();
    await driver.play(req.body);
    res.json({ status: 'ok' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: '合成器播放失敗' });
  }
}

export function healthzController(req, res) {
  res.json({ status: 'ok' });
}
