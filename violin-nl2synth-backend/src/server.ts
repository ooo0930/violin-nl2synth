import app from './app';
import logger from './logger';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Backend API listening on port ${PORT}`));
