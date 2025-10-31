import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3000"),
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: parseInt(process.env.DB_PORT ?? "3306"),
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS ?? "").split(","),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? "100"),
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  STORE_TZ: "America/Fortaleza", // TODO: injetar via env se necessário
};
