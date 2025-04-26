// 跨平台自動開啟 http://localhost:5173
const { exec } = require('child_process');
const url = 'http://localhost:5173';

function openBrowser() {
  const platform = process.platform;
  if (platform === 'darwin') {
    exec(`open ${url}`);
  } else if (platform === 'win32') {
    exec(`start ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}

// 延遲 2 秒，確保前端啟動
setTimeout(openBrowser, 2000);
