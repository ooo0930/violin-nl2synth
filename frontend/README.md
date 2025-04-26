# Frontend

本目錄為 Violin Natural Language to Synthesizer 的前端，採用模組化 React 架構。

- `components/`：可重用 UI 元件
- `services/`：呼叫後端 API 的邏輯
- `App.jsx`：主應用入口

## 快速開始
```bash
npm install
npm run dev
```

## 介面說明
- 輸入自然語言描述
- 點擊「生成並播放」
- 顯示狀態與錯誤提示

## 服務呼叫
- 主要呼叫 `/translate` `/parametrize` `/play` `/healthz` API
