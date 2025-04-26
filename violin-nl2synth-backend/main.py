import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Any
from dotenv import load_dotenv
import openai

# 載入環境變數
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

app = FastAPI()

# ----------- 資料結構定義 -----------
class NLRequest(BaseModel):
    description: str

class ViolinPhrase(BaseModel):
    notes: List[dict]  # 每個 dict: {pitch, duration, velocity, ...}

class SynthParams(BaseModel):
    params: Any  # 依據 MFM-synth-juce-main 定義

# ----------- LLM 轉譯層 -----------
@app.post("/translate", response_model=ViolinPhrase)
def translate_nl_to_violin(req: NLRequest):
    prompt = f"將下列描述轉為小提琴演奏語言（JSON，含 pitch, duration, velocity）：{req.description}"
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256
        )
        content = response.choices[0].message['content']
        # 嘗試解析 JSON
        import json
        notes = json.loads(content)
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------- 參數化層 -----------
@app.post("/parametrize", response_model=SynthParams)
def violinlang_to_params(phrase: ViolinPhrase):
    # 這裡需根據 MFM-synth-juce-main 的參數命名規則做映射
    # 範例假設直接 passthrough
    params = []
    for note in phrase.notes:
        mapped = {
            "note": note.get("pitch"),
            "duration": note.get("duration"),
            "velocity": note.get("velocity", 100),
            # 可根據 MFM-synth-juce-main 補充其他參數
        }
        params.append(mapped)
    return {"params": params}

# ----------- 驅動層 -----------
@app.post("/play")
def play_synth(params: SynthParams):
    # 假設 MFM-synth-juce-main 提供 EXE 或 DLL，可用 subprocess 呼叫
    import subprocess
    import json
    try:
        # 將參數寫入暫存檔
        with open("temp_params.json", "w", encoding="utf-8") as f:
            json.dump(params.params, f)
        # 呼叫合成器（此處僅為範例，請依實際 EXE/DLL 路徑與參數調整）
        synth_exe = os.path.abspath("../MFM-synth-juce-main/synth.exe")
        result = subprocess.run([synth_exe, "temp_params.json"], capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(result.stderr)
        return {"status": "ok", "output": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
