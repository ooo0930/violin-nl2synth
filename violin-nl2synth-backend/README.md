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

## 參數 mapping 說明
- 參數自動對應於 `src/synthMapper.ts`，支援所有 MFM-synth-juce-main 主要參數（pitch, velocity, duration, gain, bowPosition, vibrato, resonance, sharpness...）。
- 如需擴充 mapping 或支援特殊音色，只需修改 synthMapper.ts。

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

---

## 常見問題
- **合成器無聲音/錯誤？**
  - 請檢查 .env 路徑、參數格式與 build log，或將錯誤訊息貼給我協助。
- **如何擴充 mapping？**
  - 修改 `src/synthMapper.ts` 即可。

---

## 2025/04/26 更新
- 移除 app.listen，改由 server.ts 啟動，方便自動化測試
- 修正 MIDI 產生 channel 型別錯誤
- synthMapper 與所有 API 已通過 Jest/Supertest 全自動化測試
- 建議：如需 CI/CD，可直接用 GitHub Actions 或 Netlify 部署

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
