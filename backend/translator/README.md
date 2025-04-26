# Translator 模組

負責將自然語言描述轉譯為小提琴語言（如 JSON 樂句陣列）。

## 介面
- `Translator.translate(text: string): Promise<ViolinPhrase[]>`

## 資料格式（JSON Schema）
詳見根目錄 README。

## 使用範例
```ts
const translator = new GptTranslator();
const notes = await translator.translate('演奏一段明亮的斷奏旋律');
// notes: ViolinPhrase[]
```
