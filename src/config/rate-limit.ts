import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const max = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);

export const rateLimiter = {
  auth: rateLimit({
    windowMs,
    max: Math.floor(max / 2), // mais restritivo para /auth
    message: {
      success: false,
      error: { code: "RATE_LIMIT", message: "Too many requests, please try again later." }
    },
    standardHeaders: true,
    legacyHeaders: false
  }),
  general: rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: { code: "RATE_LIMIT", message: "Too many requests, please try again later." }
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};
