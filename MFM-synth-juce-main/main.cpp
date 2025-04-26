#include <JuceHeader.h>
#include "PluginProcessor.h"

int main (int argc, char* argv[])
{
    // 1. 解析參數檔路徑
    juce::String paramFile;
    if (argc > 1)
        paramFile = argv[1];

    // 2. 初始化音訊設備
    juce::ConsoleApplication app(argc, argv);

    // 3. 建立 AudioProcessor
    auto processor = std::make_unique<PhysicsBasedSynthAudioProcessor>();

    // 4. 讀取 json 檔並設參數
    if (paramFile.isNotEmpty()) {
        // 新增：自動判斷陣列或單一 note，批次播放
        processor->playBatch(paramFile);
    }

    // 6. 等待播放結束（或根據 note/duration 決定）
    juce::Thread::sleep(3000);

    return 0;
}
