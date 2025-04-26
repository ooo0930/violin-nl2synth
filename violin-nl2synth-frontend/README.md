# violin-nl2synth-frontend

本前端專案為小提琴自然語言合成器的使用者介面，提供自然語言輸入與參數預覽、觸發聲音播放。

---

## 功能特色
- 自然語言輸入框（如：「演奏一段憂鬱的小提琴旋律」）
- 送出按鈕，依序呼叫後端 `/translate`、`/parametrize`、`/play` API
- 參數預覽（顯示由自然語言生成的合成器參數）
- 播放狀態與錯誤提示

---

## 技術棧
- React 18+
- Vite
- Axios

---

## 快速啟動

1. 安裝依賴
   ```bash
   npm install
   ```
2. 啟動前端服務
   ```bash
   npm run dev
   ```
3. 預設連線到 http://localhost:3000 的後端服務
   - 如需修改 API 位置，請調整 `src/api.js` 或 `axios` baseURL 設定

---

## 目錄結構
- `src/App.jsx`：主介面（API 串接、參數預覽、狀態顯示）
- `src/api.js`：API 請求封裝（如有）
- `public/`：靜態資源

---

## API 串接流程
1. 使用者輸入自然語言，點擊送出
2. 依序呼叫：
   - `POST /translate`：自然語言 → notes
   - `POST /parametrize`：notes → synth params
   - `POST /play`：播放
3. 顯示參數預覽與播放狀態

---

## 常見問題
- **無法連線後端？**
  - 請確認 backend 已啟動於 http://localhost:3000
  - 如遇 CORS 問題，可於 vite.config.js 設定 proxy
- **參數預覽異常/無法播放？**
  - 請確認後端 API 路徑與參數格式

---

## 雲端部署教學
- 推薦 Vercel 或 Netlify，支援 React/Vite 專案免費部署
- 註冊 https://vercel.com/ 或 https://netlify.com/
- 新增專案，連結 GitHub，build 指令 `npm run build`，publish 目錄 `dist`
- 部署後將 backend API baseURL 設為 Render 雲端網址

## MIDI 播放/下載
- 若 backend 已部署 `/midi` API，前端可直接串接取得 MIDI 檔案網址
- 可用 JS 播放（如 Tone.js）或直接下載

## 近期重大變動
- 文件補充雲端部署、MIDI 串接教學
- 建議前端支援 MIDI 播放/下載功能

---

# English Summary

## Overview
This frontend provides a React-based UI for entering natural language, previewing generated synth parameters, and triggering playback via backend APIs.

## Quick Start
1. Install dependencies: `npm install`
2. Start: `npm run dev`

## API Flow
- `POST /translate` → `POST /parametrize` → `POST /play`

## Structure
- `src/App.jsx`: Main UI & API logic

---
