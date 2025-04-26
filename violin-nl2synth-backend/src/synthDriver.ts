import { exec } from 'child_process';
import { logger } from './logger';

export function playSynthFromJson(jsonPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const synthPath = process.env.SYNTH_PATH;
    if (!synthPath) {
      const errMsg = '環境變數 SYNTH_PATH 未設定，請在 .env 檔案中指定合成器執行檔路徑';
      logger.error(errMsg);
      return reject(errMsg);
    }
    exec(`${synthPath} ${jsonPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error('[合成器錯誤]', stderr || error.message);
        return reject(stderr || error.message);
      }
      if (stdout) logger.info('[合成器輸出]', stdout);
      logger.info(`Synth played: ${jsonPath}`);
      resolve();
    });
  });
}
