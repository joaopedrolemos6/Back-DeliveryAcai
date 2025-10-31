import express from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "../../config/cors";
import { rateLimiter } from "../../config/rate-limit";
import { registerRoutes } from "../../app/routes";
import { errorMiddleware } from "../../app/middlewares/error.middleware";
import { logger } from "../logging/logger";

export function bootstrap() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use((req, _res, next) => {
    (req as any).correlationId = crypto.randomUUID();
    logger.bindings({ correlationId: (req as any).correlationId });
    next();
  });

  app.use("/auth", rateLimiter.auth);
  registerRoutes(app);

  app.use(errorMiddleware);
  return app;
}
