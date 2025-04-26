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
- `/translate`：自然語言 → 小提琴語言
- `/parametrize`：小提琴語言 → 合成器參數（已自動 mapping）
- `/play`：將參數寫入 JSON，呼叫合成器執行檔自動播放

---

## 參數 mapping 說明
- 參數自動對應於 `src/synthMapper.ts`，支援所有 MFM-synth-juce-main 主要參數（pitch, velocity, duration, gain, bowPosition, vibrato, resonance, sharpness...）。
- 如需擴充 mapping 或支援特殊音色，只需修改 synthMapper.ts。

---

## 合成器自動化流程
1. 前端輸入自然語言
2. 後端自動轉換參數並產生 JSON
3. 直接呼叫 C++ JUCE Standalone 合成器執行檔並播放
4. 合成器根據 JSON 內容自動彈奏正確音符與音色

---

## 常見問題
- **合成器無聲音/錯誤？**
  - 請檢查 .env 路徑、參數格式與 build log，或將錯誤訊息貼給我協助。
- **如何擴充 mapping？**
  - 修改 `src/synthMapper.ts` 即可。
- **如何支援和弦/多音？**
  - 調整 JSON 結構與 C++ play()，即可支援批量 note。

---

如需進階自動化、批次 note、特殊音色控制等，請直接提出，我會自動幫你補齊所有程式碼！
