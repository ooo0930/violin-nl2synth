# ParamMapper 模組

將小提琴語言（ViolinPhrase[]）轉為合成器參數（SynthParam[]），並進行 JSON Schema 驗證。

## 介面
- `mapToSynthParams(notes: ViolinPhrase[], config): SynthParam[]`

## JSON Schema 驗證
詳見根目錄 README。

## 錯誤處理
- 若驗證失敗，將自動重試或回傳預設參數。

## 使用範例
```ts
const params = mapToSynthParams(notes, config);
```
