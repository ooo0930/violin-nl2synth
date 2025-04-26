# 小提琴 NL2Synth 系統

本專案讓你用自然語言描述，直接產生小提琴合成器參數並自動播放真實合成器（MFM-synth-juce-main，已改為獨立執行檔）。Node.js/TypeScript 負責前後端主控，C++/JUCE Standalone 負責高品質聲音生成。

---

## 架構總覽

- **前端**：React/Vite 輸入自然語言，呼叫後端 API
- **後端**：Node.js/Express，負責：
  - 轉換自然語言 → 小提琴語言 → 合成器參數（自動 mapping）
  - 產生 JSON 參數檔
  - 直接呼叫 C++ JUCE Standalone 合成器執行檔
- **合成器**：MFM-synth-juce-main（已改為 Standalone Application，支援命令列接收 JSON 參數並自動發聲）

---

## 參數格式與自動對應

### NL2Synth 標準參數格式
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

## 合成器串接與自動化流程

1. **編譯合成器 Standalone 執行檔**
   - 用 Projucer 將 MFM-synth-juce-main 設為 Standalone Application，build 出可執行檔。
   - 編譯後將執行檔路徑加入 `.env`：
     ```
     SYNTH_PATH=/你的/MFM-synth-juce-main/執行檔
     ```
2. **啟動後端**
   - `npm install && npm run dev` 於 violin-nl2synth-backend
3. **前端輸入自然語言，觸發 /play**
   - 參數自動 mapping，產生 JSON，呼叫合成器執行檔並播放
4. **C++ 合成器自動解析 JSON 並發聲**
   - 支援 pitch、velocity、duration、gain、bowPosition、vibrato、resonance、sharpness ...
   - 每次呼叫自動依參數彈奏正確音符與音色

---

## 範例 JSON
```json
{
  "pitch": 69,
  "duration": 1.0,
  "velocity": 60,
  "intensity": 0.8,
  "bowPosition": 70.0,
  "vibrato": 0.1,
  "resonance": 0.5,
  "sharpness": 0.5
}
```

---

## 專案結構

/violin-nl2synth-backend        # Node.js 後端（API/mapping/自動呼叫合成器）
/violin-nl2synth-frontend       # React 前端（UI/互動）
/MFM-synth-juce-main            # C++ JUCE 合成器（Standalone Application）
/config                         # 多環境設定
/scripts                        # 自動化與輔助腳本
/README.md                      # 本檔案

---

## 常見問題

- **如何擴充 mapping？**
  - 修改 `violin-nl2synth-backend/src/synthMapper.ts` 即可。
- **如何支援和弦/多音？**
  - 調整 JSON 結構與 C++ play()，即可支援批量 note。
- **合成器無聲音/錯誤？**
  - 請檢查 .env 路徑、參數格式與 build log，或將錯誤訊息貼給我協助。

---

如需進階自動化、批次 note、特殊音色控制等，請直接提出，我會自動幫你補齊所有程式碼！
