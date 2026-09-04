import 'dotenv/config';
import app from "./app";
import config from "./config";
import { connectDatabase } from "./database/client";
import logger from "./utils/logger";

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      logger.info(`🌾 KisanMitra AI Backend running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`AI Provider: ${process.env.AI_PROVIDER || 'MOCK'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();