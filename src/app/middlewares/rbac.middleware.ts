import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../../core/errors/app-error";

export function requireRole(...roles: Array<"ADMIN"|"CLIENT">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !roles.includes(role)) return next(new ForbiddenError("Insufficient permissions"));
    next();
  };
}
