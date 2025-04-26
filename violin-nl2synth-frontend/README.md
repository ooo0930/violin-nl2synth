# violin-nl2synth-frontend

本前端專案為小提琴自然語言合成器的使用者介面。

## 功能
- 自然語言輸入框（例如：「演奏一段憂鬱的小提琴旋律」）
- 送出按鈕，觸發後端 API
- 播放/暫停/重播按鈕
- 狀態與錯誤提示

## 技術棧
- React 18+
- Vite
- Axios

## 啟動方式
```bash
npm install
npm run dev
```

## 目錄結構
- `src/App.jsx`：主介面
- `src/api.js`：API 請求封裝
- `public/`：靜態資源

---

後端請先啟動於 http://localhost:8000
