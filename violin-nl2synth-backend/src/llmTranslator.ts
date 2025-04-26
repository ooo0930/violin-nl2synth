// 開發階段：直接回傳範例音符陣列，不呼叫任何外部 API
// 若未來需升級為 OpenAI，只需恢復原本 axios 呼叫即可

export async function llmTranslateWithRetry(prompt: string, maxRetry = 3, fallback: any = null): Promise<any> {
  // 開發/測試用範例
  return [
    { pitch: 69, duration: 1.0, velocity: 60 },
    { pitch: 71, duration: 1.0, velocity: 70 },
    { pitch: 72, duration: 2.0, velocity: 90 }
  ];
}

// 升級為 OpenAI 時，請將下列程式碼取消註解並刪除上方內容：
/*
import axios from 'axios';
import { logger } from './logger';

export async function llmTranslateWithRetry(prompt: string, maxRetry = 3, fallback: any = null): Promise<any> {
  let lastError;
  for (let i = 0; i < maxRetry; i++) {
    try {
      const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      const json = JSON.parse(resp.data.choices[0].message.content);
      return json;
    } catch (e) {
      logger.error(`LLM Error (attempt ${i + 1}): ${e}`);
      lastError = e;
      await new Promise(res => setTimeout(res, 2 ** i * 200));
    }
  }
  logger.warn('LLM fallback triggered');
  return fallback || [{ pitch: 60, duration: 1.0, velocity: 80 }];
}
*/
