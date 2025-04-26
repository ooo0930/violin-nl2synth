import sys
import time
try:
    import winsound
except ImportError:
    winsound = None

print("收到參數：", sys.argv)
# 播放一個 beep 聲
if winsound:
    winsound.Beep(880, 500)
else:
    # Mac/Linux
    import os
    os.system('afplay /System/Library/Sounds/Glass.aiff')
