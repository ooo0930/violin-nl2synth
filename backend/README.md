# Backend

本目錄為 Violin Natural Language to Synthesizer 的後端，採用模組化設計，便於擴展與維護。

- `translator/`：AI 轉譯層，定義 Translator 介面與各種 LLM 實作
- `paramMapper/`：參數化層，將小提琴語言轉為合成器參數
- `synthDriver/`：驅動層，定義 SynthDriver 介面與合成器呼叫
- `api/`：API 層，統一路由與控制器
- `utils/`：共用工具（logger, validator）

## 快速開始
```bash
npm install
npm run dev
```

## 介面與資料格式
- 詳見各資料夾內 interface 定義與 JSON Schema

## 健康檢查
- `GET /healthz` 回傳 `{ status: 'ok' }`
