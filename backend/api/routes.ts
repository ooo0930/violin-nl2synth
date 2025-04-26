import express from 'express';
import { translateController, parametrizeController, playController, healthzController } from './controller';

const router = express.Router();

router.post('/translate', translateController);
router.post('/parametrize', parametrizeController);
router.post('/play', playController);
router.get('/healthz', healthzController);

export default router;
