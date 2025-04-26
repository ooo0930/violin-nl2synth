# violin-nl2synth-backend

本後端服務負責：
- 接收前端自然語言描述
- 調用 LLM 轉譯為小提琴語言（音高、時值、力度等）
- 依據 MFM-synth-juce-main 參數規則自動 mapping 為合成器參數
- 產生 JSON 參數檔並呼叫 C++ JUCE Standalone 合成器執行檔自動播放

---

## 技術棧
- Node.js 18+/TypeScript
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

---

## 主要 API

- `POST /translate`：自然語言 → 小提琴語言
  - 輸入： `{ description: "演奏一段溫柔的小提琴旋律" }`
  - 回傳： `[{ pitch: 69, duration: 1.0, velocity: 60 }, ...]`
- `POST /parametrize`：小提琴語言 → 合成器參數（自動 mapping）
  - 輸入： `[ { pitch, duration, velocity, ... } ]`
  - 回傳： `[ { pitch, duration, velocity, intensity, bowPosition, vibrato, ... } ]`
- `POST /play`：將參數寫入 JSON，呼叫合成器執行檔自動播放
  - 輸入： `[ { pitch, duration, velocity, ... } ]`
  - 回傳： `{ status: "playing" }`
- `POST /midi`：自動產生四小節小提琴旋律 MIDI 檔，回傳下載網址
  - 適合雲端部署，不需本地 C++ 執行檔
  - 產生的 MIDI 檔可用任何播放器或 JS 於前端播放

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

### 主要 API 說明

- `/translate`：自然語言 → 小提琴能演奏的音樂描述（LLM）
- `/describe2notes`：音樂描述 → 音符陣列（LLM）
- `/parametrize`：音符陣列 → 合成器參數
- `/full`：一鍵串接所有流程，回傳描述、音符、參數與 MIDI 檔案網址

---

## 參數 mapping 說明
- 參數自動對應於 `src/synthMapper.ts`，支援所有 MFM-synth-juce-main 主要參數（pitch, velocity, duration, gain, bowPosition, vibrato, resonance, sharpness...）。
- 如需擴充 mapping 或支援特殊音色，只需修改 synthMapper.ts。

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

### 參數字典檔案

- `src/config/synthParamDictionary.json`：所有合成器參數的範圍、預設值與說明

---

### 字典 mapping 範例

- 「激烈」→ intensity=0.95, gain=0.95, vibrato=0.7, articulation=0.8
- 「柔和」→ intensity=0.5, gain=0.6, vibrato=0.2, articulation=0.2
- 「顫音」→ vibrato=0.9
- 「明亮」→ sharpness=0.9, resonance=0.7
- 「厚重」→ sharpness=0.2, resonance=0.9

---

## 前後端/聲音全流程對接

### 前端（violin-nl2synth-frontend）
- 只需呼叫 `/full` API，輸入自然語言描述，即可取得：
  - `musicDescription`（結構化音樂語意）
  - `midiParams`（MIDI 參數陣列）
  - `synthParams`（合成器物理參數字典）
  - `midiUrl`（MIDI 檔案下載連結）
- 介面同時顯示所有參數與 MIDI 下載連結，方便人工或自動傳遞給合成器。

### 後端（violin-nl2synth-backend）
- `/full` API：自動串接 LLM → 音樂描述 → 音符 → 參數 mapping → MIDI 產生。
- `synthParamDictionary.json`：定義所有合成器參數範圍、預設值與語意。
- `mapDescriptionToSynthParams`：根據描述自動產生物理參數，並可擴充規則。
- `generateViolinMidi`：產生 MIDI 檔案，支援下載。
- `playSynthFromJson`：可將參數 JSON 傳遞給本地 MFM-synth-juce-main 合成器。

### 聲音合成對接
- 下載 MIDI 檔後，可用 DAW 或其他音源播放。
- 若需直接物理合成，將 `synthParams` 轉為 JSON，傳給 MFM-synth-juce-main 執行檔（路徑由 .env 設定 SYNTH_PATH）。
- 範例指令：`SYNTH_PATH=path/to/MFM-synth-juce-main ./MFM-synth-juce-main synthParams.json`

### 端到端流程圖

```
[前端輸入]
   │
   ▼
[POST /full]
   │
   ├──> musicDescription
   ├──> midiParams
   ├──> synthParams
   └──> midiUrl
   │
   ▼
[下載 MIDI 或傳參數給合成器]
```

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

---

# English Summary

## Overview
This backend receives natural language, translates it to violin note arrays, maps to synthesizer parameters, and triggers a JUCE-based standalone synthesizer. See `.env` for synth path config.

## Quick Start
1. Install dependencies: `npm install`
2. Set `SYNTH_PATH` in `.env`
3. Run: `npm run dev`

## Main Endpoints
- `POST /translate`: NL → notes
- `POST /parametrize`: notes → synth params
- `POST /play`: trigger synth
- `POST /midi`: generate MIDI file

## Env Vars
- `SYNTH_PATH`: Path to synth executable

---
