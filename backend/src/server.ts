import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT || env.PORT || 3001);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on http://${HOST}:${PORT} in ${env.NODE_ENV} mode`);
});
