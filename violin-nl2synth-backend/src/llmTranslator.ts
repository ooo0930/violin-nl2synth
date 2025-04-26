// 開發階段：直接回傳範例音符陣列，不呼叫任何外部 API
// 若未來需升級為 OpenAI，只需恢復原本 axios 呼叫即可

// 使用 Hugging Face 免費 LLM API，自然語言生成音符陣列
import fetch from 'node-fetch';

// 你可以改用其他支援的模型，例如：google/flan-t5-small、tiiuae/falcon-7b-instruct 等
const HF_API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
const HF_API_KEY = process.env.HF_API_KEY || '';

export async function llmTranslateWithRetry(prompt: string, maxRetry = 3, fallback: any = null): Promise<any> {
  let lastError;
  for (let i = 0; i < maxRetry; i++) {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (HF_API_KEY) headers['Authorization'] = `Bearer ${HF_API_KEY}`;
      const resp = await fetch(HF_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: `請將這段描述轉成小提琴音符陣列（JSON）：${prompt}\n範例輸出: [{"pitch":69,"duration":1.2,"velocity":60},{"pitch":71,"duration":1.0,"velocity":70},{"pitch":72,"duration":2.0,"velocity":90}]` })
      });
      const data = await resp.json();
      // Hugging Face 回傳格式可能是 { generated_text: '...' }
      let content = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text : data.generated_text || '';
      // 嘗試解析 JSON
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // 若直接是 JSON 陣列
      if (Array.isArray(data)) return data;
    } catch (e) {
      lastError = e;
      await new Promise(res => setTimeout(res, 2 ** i * 200));
    }
  }
  return fallback || [{ pitch: 60, duration: 1.0, velocity: 80 }];
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
