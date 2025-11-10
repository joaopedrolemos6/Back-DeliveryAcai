import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Erro capturado:", err);

  // Se o erro tiver um statusCode válido, usa ele. Caso contrário, assume 500.
  const statusCode = typeof err.statusCode === "number" && err.statusCode >= 100 && err.statusCode <= 599
    ? err.statusCode
    : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Erro interno no servidor",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
