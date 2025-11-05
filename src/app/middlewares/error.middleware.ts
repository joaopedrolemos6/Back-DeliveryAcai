import { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/app-error";
import { logger } from "../../infra/logging/logger";

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  // 🔥 Log detalhado para debug
  console.error("🔥 ERROR:", {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    code: err?.code,
  });

  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, "AppError handled");
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected error occurred." },
  });
}
