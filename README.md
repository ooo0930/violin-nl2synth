# 小提琴 NL2Synth 系統

本專案讓你用自然語言描述，直接產生小提琴合成器參數並自動播放真實合成器（MFM-synth-juce-main，已改為獨立執行檔）。Node.js/TypeScript 負責前後端主控，C++/JUCE Standalone 負責高品質聲音生成。

---

## 專案架構

- **前端**：React/Vite 輸入自然語言，呼叫後端 API
- **後端**：Node.js/Express，負責：
  - 轉換自然語言 → 小提琴語言 → 合成器參數（自動 mapping）
  - 產生 JSON 參數檔
  - 直接呼叫 C++ JUCE Standalone 合成器執行檔
- **合成器**：MFM-synth-juce-main（已改為 Standalone Application，支援命令列接收 JSON 參數並自動發聲）

---

## 專案結構

```
violin-nl2synth/
├── violin-nl2synth-backend/        # Node.js/TypeScript 後端
├── violin-nl2synth-frontend/       # React 前端
├── MFM-synth-juce-main/            # C++ JUCE 合成器
├── start.sh                        # 一鍵啟動腳本
├── README.md                       # 本說明文件
└── ...
```

---

## 快速啟動

1. **編譯合成器 Standalone 執行檔**
   - 用 Projucer 將 MFM-synth-juce-main 設為 Standalone Application，build 出可執行檔。
   - 編譯後將執行檔路徑加入 `.env`：
     ```
     SYNTH_PATH=/你的/MFM-synth-juce-main/執行檔
     ```
2. **啟動後端**
   ```bash
   cd violin-nl2synth-backend
   npm install
   npm run dev
   ```
3. **啟動前端**
   ```bash
   cd violin-nl2synth-frontend
   npm install
   npm run dev
   ```
4. **一鍵啟動（可選）**
   ```bash
   ./start.sh
   ```

---

## API 流程

1. 前端輸入自然語言，送出 `/translate`
2. 後端將自然語言轉為音符陣列
3. `/parametrize`：音符陣列轉為合成器參數
4. `/play`：將參數寫入 JSON，呼叫合成器執行檔自動播放

---

## 雲端部署與 MIDI 產生

- 本專案支援將 backend (Node.js/Express) 及 frontend (React) 部署到免費雲端（Render/Vercel/Netlify）。
- 後端內建 `/midi` API，可根據自然語言描述自動產生四小節小提琴 MIDI 檔案，支援下載或線上播放。
- 雲端部署不需 C++ 執行檔，僅需 Node.js/JS。

### 雲端部署教學

1. **Backend (Node.js) 部署到 Render（推薦）**
   - 註冊 https://render.com/
   - 新增 Web Service，連結 GitHub 專案，啟動指令 `npm run dev`
   - 部署後取得 API baseURL（如 `https://xxx.onrender.com`）
2. **Frontend (React) 部署到 Vercel/Netlify**
   - 註冊 https://vercel.com/ 或 https://netlify.com/
   - 新增專案，連結 GitHub，預設 build 指令 `npm run build`，publish 目錄 `dist`
   - 部署後將 backend API baseURL 設為 Render 網址

### MIDI 流程說明

- 使用者於前端輸入自然語言
- 前端呼叫 `/midi` API，後端自動產生四小節小提琴旋律 MIDI 檔
- 回傳下載網址，前端可直接下載或用 JS 播放

---

## 標準參數格式

```json
{
  "pitch": 69,
  "duration": 1.0,
  "velocity": 60,
  "intensity": 0.8,
  "bowPosition": "middle",
  "vibrato": 0.1
}
```

### 自動對應到 MFM-synth-juce-main 格式
| NL2Synth 欄位  | MFM-synth-juce 欄位 |
|----------------|---------------------|
| pitch          | pitch               |
| duration       | duration            |
| velocity       | velocity            |
| intensity      | gain                |
| bowPosition    | bowPosition         |
| vibrato        | vibrato             |
| articulation   | resonance/sharpness |

- 參數 mapping 已自動於 `violin-nl2synth-backend/src/synthMapper.ts` 實作。
- 支援自訂 mapping 與預設值。

---

## 近期重大變動
- 新增 `/midi` API，支援雲端產生小提琴 MIDI
- 文件補充雲端部署教學與 MIDI 流程
- 專案結構與啟動教學同步更新

---

## 常見問題

- **如何擴充 mapping？**
  - 修改 `violin-nl2synth-backend/src/synthMapper.ts` 即可。
- **如何支援和弦/多音？**
  - 調整 JSON 結構與 C++ play()，即可支援批量 note。
- **合成器無聲音/錯誤？**
  - 請檢查 .env 路徑、參數格式與 build log，或將錯誤訊息貼給我協助。

---

## 2025/04/26 專案狀態總整理

- 後端（violin-nl2synth-backend）
  - Node.js/TypeScript + Express
  - 所有 API 已自動化測試（Jest/Supertest）100% 通過
  - MIDI 產生、參數 mapping、合成器控制皆模組化
  - 適合本地與雲端部署
- 前端（violin-nl2synth-frontend）
  - React/Vite，支援自然語言輸入、參數預覽、API 串接
  - 可進一步加上自動化測試（建議用 @testing-library/react）
- 合成器（MFM-synth-juce-main）
  - 已改為 Standalone Application，直接由後端呼叫
- 一鍵啟動腳本 start.sh
- .env、.gitignore、CI/CD、部署範例皆完整
- 所有程式碼、測試、部署腳本皆已同步至 git，適合團隊協作

---

## 更新紀錄（2025/04/26）
- 修正後端 listen 衝突，app/server 分離
- 修正 MIDI 產生型別錯誤
- 所有自動化測試通過
- 前端/後端 README 完整補充
- 建議：前端可加上自動化測試腳本

---

## 聯絡/協助
如需進階自動化、批次 note、特殊音色控制等，請直接提出，我會自動幫你補齊所有程式碼！

---

# English Summary

## Project Overview
This project converts natural language descriptions into violin synthesizer parameters and triggers playback using a JUCE-based standalone synthesizer. The backend (Node.js/TypeScript) handles language processing and parameter mapping; the frontend (React) provides the user interface; the synthesizer is built in C++/JUCE.

## Quick Start
1. Build the C++ JUCE standalone synthesizer and set the executable path in `.env` (`SYNTH_PATH`).
2. Start backend (`cd violin-nl2synth-backend && npm install && npm run dev`).
3. Start frontend (`cd violin-nl2synth-frontend && npm install && npm run dev`).

## API Endpoints
- `/translate`: Natural language → note array
- `/parametrize`: Note array → synth parameters
- `/play`: Triggers synthesizer playback

## Directory Structure
- `violin-nl2synth-backend/`: Backend (API, mapping, synth trigger)
- `violin-nl2synth-frontend/`: Frontend (UI)
- `MFM-synth-juce-main/`: Synthesizer (C++ JUCE)

---
