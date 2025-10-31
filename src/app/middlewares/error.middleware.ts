import { Request, Response, NextFunction } from "express";
import { mapErrorToHttp } from "../../core/errors/error-mapper";

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const { status, code, message, details } = mapErrorToHttp(err);
  res.status(status).json({
    success: false,
    error: { code, message, details, correlationId: (req as any).correlationId }
  });
}
