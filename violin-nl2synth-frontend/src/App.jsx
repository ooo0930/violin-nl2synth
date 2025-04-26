import React, { useState } from "react";
import axios from "axios";

function App() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [paramPreview, setParamPreview] = useState(null); // 參數預覽

  // ====== 新增全自動 /full API 流程 ======
  const handleFullAuto = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");
    setParamPreview(null);
    try {
      const res = await axios.post("/full", { description });
      setParamPreview({
        音樂描述: res.data.musicDescription,
        MIDI參數: res.data.midiParams,
        合成器參數: res.data.synthParams,
      });
      setStatus(
        <span>
          MIDI 已生成：<a href={res.data.midiUrl} target="_blank" rel="noopener noreferrer">下載 MIDI</a>
        </span>
      );
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>小提琴 AI 合成器</h2>
      <form onSubmit={handleFullAuto}>
        <textarea
          rows={4}
          style={{ width: "100%", fontSize: 16 }}
          placeholder="輸入自然語言描述，例如：演奏一段憂鬱的小提琴旋律"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        <button type="submit" style={{ marginTop: 12 }} disabled={loading || !description}>
          {loading ? "處理中..." : "全自動生成 MIDI 與參數"}
        </button>
      </form>
      {paramPreview && (
        <div style={{ marginTop: 18, background: "#f5f5f5", padding: 12, borderRadius: 6, fontSize: 14 }}>
          <b>參數預覽：</b>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify(paramPreview, null, 2)}</pre>
        </div>
      )}
      {status && <div style={{ color: "green", marginTop: 16 }}>{status}</div>}
      {error && <div style={{ color: "red", marginTop: 16 }}>錯誤：{error}</div>}
      <div style={{ marginTop: 32, color: "#888" }}>
        <b>說明：</b> 本系統將自然語言描述轉為小提琴 MIDI 與物理參數，可下載 MIDI 檔並傳遞參數給合成器。
      </div>
    </div>
  );
}

export default App;
