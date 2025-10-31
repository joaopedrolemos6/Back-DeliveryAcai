import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../infra/security/jwt";
import { ForbiddenError, UnauthorizedError } from "../../core/errors/app-error";

export function auth(required = true) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (!required) return next();
      return next(new UnauthorizedError("Missing Authorization header"));
    }
    const token = header.replace(/^Bearer\s+/i, "");
    try {
      const payload = verifyAccessToken(token);
      (req as any).user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
  };
}
