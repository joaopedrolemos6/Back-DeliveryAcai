import { bootstrap } from "./infra/http/express";
import { env } from "./config/env";
import { pool } from "./infra/db/connection";
import { logger } from "./infra/logging/logger";

const app = bootstrap();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "HTTP server started");
});

const shutdown = async (signal: string) => {
  logger.warn({ signal }, "Shutting down...");
  server.close(async () => {
    try {
      await pool.end();
      logger.info("DB pool closed");
    } catch (e) {
      logger.error(e, "Error closing DB pool");
    } finally {
      process.exit(0);
    }
  });
};

["SIGINT", "SIGTERM"].forEach(sig => process.on(sig, () => shutdown(sig)));
