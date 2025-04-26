import { Translator, ViolinPhrase } from './translator';
import axios from 'axios';

export class GptTranslator implements Translator {
  async translate(text: string): Promise<ViolinPhrase[]> {
    // 實際應根據 config 取 API Key
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `請將下列描述轉為小提琴語言JSON: ${text}` }],
      max_tokens: 256
    }, {
      headers: {
        Authorization: `Bearer YOUR_OPENAI_API_KEY`,
        'Content-Type': 'application/json'
      }
    });
    return JSON.parse(response.data.choices[0].message.content);
  }
}
