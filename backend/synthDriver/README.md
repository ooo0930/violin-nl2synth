# SynthDriver 模組

負責將參數送入合成器並觸發播放。

## 介面
- `SynthDriver.play(params: SynthParam[]): Promise<void>`

## 可插拔實作
- JuceDriver: 呼叫 synth.exe

## 使用範例
```ts
const driver = new JuceDriver();
driver.play(params);
```
