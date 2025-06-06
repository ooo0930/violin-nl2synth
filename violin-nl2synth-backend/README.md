# violin-nl2synth-backend

## 架構概覽

本系統將自然語言描述轉譯為小提琴合成音樂，流程分為五大層：

1. **輸入層（Natural Language）**  
   使用者以自然語言輸入音樂意圖或風格描述。
2. **轉譯層（AI → Violin “語言”）**  
   AI 模型（如 LLM）將自然語言轉換為結構化的小提琴音樂描述。
3. **參數化層（Violin 語言 → SynthParam）**  
   將音樂描述解析為具體的音符與合成器參數（SynthParam）。
4. **驅動層（SynthParam → 合成器）**  
   依據參數自動生成 MIDI 檔案或直接驅動物理建模合成器產生聲音。
5. **前端互動層（UI 操作與播放）**  
   使用者透過前端 UI 操作、預覽參數、下載 MIDI 或播放合成音樂。

---

![系統流程圖](docs/overview-diagram.png)
<!-- 請將 overview-diagram.png 換成實際流程圖檔案，或用 mermaid 製作後補上 -->

---

本後端服務負責：
- 接收前端自然語言描述
- 調用 LLM 轉譯為小提琴語言（音高、時值、力度等）
- 依據 MFM-synth-juce-main 參數規則自動 mapping 為合成器參數
- 產生 JSON 參數檔並呼叫 C++ JUCE Standalone 合成器執行檔自動播放

---

## 技術棧
- Node.js 18+ / TypeScript
- Express
- OpenAI/HuggingFace LLM API
- C++/JUCE Standalone 合成器（由 SYNTH_PATH 指定）

---

## 快速啟動

1. **安裝依賴**
   ```bash
   npm install
   ```
2. **設定 .env**
   ```
   SYNTH_PATH=/你的/MFM-synth-juce-main/執行檔
   ```
3. **啟動服務**
   ```bash
   npm run dev
   ```

### 一鍵開啟
安裝依賴後執行：
```bash
npm install
npm run open
```
這將同時啟動後端、前端並自動在預設瀏覽器打開互動頁面。

---

## 一鍵開啟

只需執行以下指令，即可同時啟動後端、前端並自動打開瀏覽器：

```bash
npm install
npm run open
```

- 支援 Mac（open）、Linux（xdg-open）、Windows（start）自動開啟 http://localhost:5173
- 若首次使用，請先於專案根目錄下執行 `npm install concurrently` 安裝依賴

---

## 主要 API

- `POST /translate`：自然語言 → 小提琴語言
  - 輸入： `{ description: "演奏一段溫柔的小提琴旋律" }`
  - 回傳： `{ musicDescription: "一段溫柔的C大調旋律..." }`

- `POST /describe2notes`：小提琴語言 → 音符陣列
  - 輸入： `{ musicDescription: "一段溫柔的C大調旋律..." }`
  - 回傳： `[{ pitch: 69, duration: 1.2, velocity: 60 }, ...]`

- `POST /parametrize`：音符陣列 → 合成器參數（自動補全）
  - 輸入： `[{ pitch: 69, duration: 1.2, velocity: 60 }]`
  - 回傳： `[{ pitch: 69, duration: 1.2, velocity: 60, intensity: 0.6, bowPosition: "middle", vibrato: 0.15 }, ...]`

- `POST /full`：自然語言 → 音樂描述 → 音符 → 參數 → MIDI（全自動）
  - 輸入： `{ description: "演奏一段激烈的小提琴旋律" }`
  - 回傳： `{ musicDescription, midiParams, synthParams, midiUrl }`

---

## 參數映射與 config 說明

- `src/config/synthParamDictionary.json`：定義所有合成器參數的範圍、預設值與語意（若不存在，請建立並參考程式碼邏輯）。
- `/parametrize` 會自動補全：
  - `intensity`（根據 velocity 或描述）
  - `bowPosition`（預設 middle，可依描述調整）
  - `vibrato`（根據描述或隨機微調）

---

## 全自動 LLM 小提琴生成流程

本專案已支援「一鍵自然語言生成 AI 小提琴音樂」全自動流程，串接 Hugging Face 免費 LLM，無須 OpenAI 金鑰。

### 系統流程圖

```
[任何自然語言]
      │
      ▼
/translate (LLM)
      │
      ▼
[小提琴能演奏的音樂描述]
      │
      ▼
/describe2notes (LLM)
      │
      ▼
[音符陣列]
      │
      ▼
/parametrize
      │
      ▼
[MIDI 參數]
      │
      ▼
[產生 MIDI 檔案]
      │
      ▼
/violin_full.mid（下載/播放）
```

---

### 一鍵生成 API

- **POST** `/full`
- **Body 範例：**
```json
{
  "description": "下雨天的溫柔心情"
}
```
- **回傳：**
```json
{
  "musicDescription": "抒情的C大調小提琴旋律，節奏中等，情感豐富",
  "notes": [
    { "pitch": 69, "duration": 1.2, "velocity": 60 },
    ...
  ],
  "params": [ ... ],
  "midiUrl": "/violin_full.mid"
}
```

---

## 主要 API 說明

- `/translate`：自然語言 → 小提琴能演奏的音樂描述（LLM）
- `/describe2notes`：音樂描述 → 音符陣列（LLM）
- `/parametrize`：音符陣列 → 合成器參數
- `/full`：一鍵串接所有流程，回傳描述、音符、參數與 MIDI 檔案網址

---

## 參數字典優化與雙層控制

本專案已參考 MFM-synth-juce-main，將參數分為兩大類：

- **MIDI 參數**：pitch, duration, velocity
- **合成器參數**（物理建模）：bowPosition, gain, vibrato, resonance, sharpness, articulation, intensity ...

所有合成器參數定義於 `src/config/synthParamDictionary.json`，每個參數有範圍、預設值與語意說明。

### 字典自動 mapping 流程

```
[自然語言]
   │
   ▼
[LLM] → [音樂描述]
   │
   ├── [LLM/Mapping] → [MIDI 參數]
   │
   └── [字典 mapping] → [合成器參數]
   │
   ▼
[產生 MIDI 檔] + [合成器參數 JSON]
```

### /full API 新增輸出

- `musicDescription`：結構化音樂語意
- `midiParams`：MIDI 控制參數（陣列）
- `synthParams`：合成器物理參數（字典，依據 MFM-synth-juce-main）
- `midiUrl`：MIDI 檔案下載連結

---

## 參數字典檔案

- `src/config/synthParamDictionary.json`：所有合成器參數的範圍、預設值與說明

---

## 標準參數格式

#### JSON Schema（含 default）

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "pitch": { "type": "integer" },
      "duration": { "type": "number" },
      "velocity": { "type": "integer" },
      "intensity": { "type": "number", "default": 0.8 },
      "bowPosition": { "type": "string", "default": "middle" },
      "vibrato": { "type": "number", "default": 0.1 },
      "resonance": { "type": "number", "default": 0.5 },
      "sharpness": { "type": "number", "default": 0.5 },
      "articulation": { "type": "number", "default": 0.5 },
      "gain": { "type": "number", "default": 0.8 }
    },
    "required": ["pitch", "duration", "velocity"]
  }
}
```

---

## 錯誤重試與 Fallback

- 本系統呼叫 LLM（如 Hugging Face API）時，若未回傳合法 JSON，會自動重試最多 3 次。
- 若多次仍失敗，將回傳預設旋律：
  ```json
  [
    { "pitch": 60, "duration": 1.0, "velocity": 80 }
  ]
  ```
- 詳細策略請參見 `llmTranslateWithRetry` 實作，確保服務穩定不中斷。

---

## 性能監控與延遲量測

- 可於 Node.js 內部加入計時程式碼監控 API 延遲：
  ```js
  const start = process.hrtime();
  // ... 業務邏輯 ...
  const [sec, nano] = process.hrtime(start);
  const ms = sec * 1000 + nano / 1e6;
  console.log(`API 執行時間: ${ms} ms`);
  ```
- 若需外部監控，建議整合 Prometheus，於 backend 加入 `/metrics` 路徑：
  ```js
  import promBundle from "express-prom-bundle";
  app.use(promBundle({ includeMethod: true }));
  // 自動產生 /metrics endpoint，供 Prometheus 抓取
  ```
- 可追蹤如 API 延遲、請求次數等指標。

---

## 環境變數
- `.env` 檔必須設定：
  - `SYNTH_PATH`：C++ 合成器執行檔路徑
  - （如需 LLM，可加 `OPENAI_API_KEY` 等）

---

## 合成器自動化流程
1. 前端輸入自然語言
2. 後端自動轉換參數並產生 JSON
3. 直接呼叫 C++ JUCE Standalone 合成器執行檔並播放
4. 合成器根據 JSON 內容自動彈奏正確音符與音色

---

## 雲端部署教學
- 推薦 Render 部署 backend，支援 Node.js/Express，免費方案可用
- 註冊 https://render.com/，新建 Web Service，連結 GitHub，啟動指令 `npm run dev`
- 設定 public 目錄供 MIDI 檔下載
- `.env` 僅需設定必要變數，不需 SYNTH_PATH

---

## MIDI 流程
1. 前端送出自然語言描述
2. 後端 `/midi` API 產生四小節小提琴旋律 MIDI
3. 回傳下載網址，前端可直接下載或播放

---

## 近期重大變動
- 新增 MIDI 產生 API
- 文件補充雲端部署與流程
- 新增參數字典優化與雙層控制說明
- README 補充前後端與聲音端到端對接細節、全自動 API 流程、參數傳遞與合成器連動說明

---

## 常見問題
- **合成器無聲音/錯誤？**
  - 請檢查 .env 路徑、參數格式與 build log，或將錯誤訊息貼給我協助。
- **如何擴充 mapping？**
  - 修改 `src/synthMapper.ts` 即可。

---

## 本地測試

1. 啟動 backend server
2. 用 Postman 或 curl 呼叫 `/full`，即可一鍵取得 AI 生成小提琴 MIDI
3. 下載 `/violin_full.mid` 播放

---

## LLM 免費串接

- 本專案預設使用 Hugging Face 免費 LLM API，無需付費。
- 如需高品質或即時性，可改用 OpenAI。

---

## 更新紀錄

- 2025/04/26：新增全自動 `/full` API，三層式 LLM 音樂生成流程，README 完整更新。
- 2025/04/26：移除 app.listen，改由 server.ts 啟動，方便自動化測試
- 修正 MIDI 產生 channel 型別錯誤
- synthMapper 與所有 API 已通過 Jest/Supertest 全自動化測試
- 建議：如需 CI/CD，可直接用 GitHub Actions 或 Netlify 部署
- 2025/04/26：新增 synthParamDictionary.json，參數分層 mapping，/full API 同時輸出 midiParams 與 synthParams，方便雙層控制。
- 2025/04/26 再次檢查與全流程優化
- 前端只用 /full API，參數與聲音檔案一站式取得
- README 補充前後端與聲音對接細節與流程圖
- 建議：如需自動化測試，請參考 test/api.test.ts

---

## 測試與部署
- `npm test`：執行所有自動化測試
- `npm run dev`：本地開發模式
- `node src/server.js` 或 `ts-node src/server.ts`：正式啟動
- 支援雲端部署（Netlify、Render、Railway）
