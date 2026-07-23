import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createDatabase } from './config/database.js';
import { createLogger } from './config/logger.js';
import { TokenService } from './services/token-service.js';
import { createApp } from './app.js';

const env = loadEnv(), logger = createLogger(env), db = createDatabase(env), tokens = await new TokenService(env).init();
const app = createApp({ env, db, tokens, logger });
const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'habitus_api_started'));
async function shutdown(signal) { logger.info({ signal }, 'shutdown'); server.close(async () => { await db.destroy(); process.exit(0); }); setTimeout(() => process.exit(1), 10_000).unref(); }
process.on('SIGTERM', () => shutdown('SIGTERM')); process.on('SIGINT', () => shutdown('SIGINT'));
