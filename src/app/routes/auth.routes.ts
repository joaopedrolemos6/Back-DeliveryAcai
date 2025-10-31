import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional(),
  phone: z.string().trim().min(8).optional(),
  password: z.string().min(6),
}).refine(d => !!d.email || !!d.phone, { message: "email or phone required" });

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

const tokenSchema = z.object({ refreshToken: z.string().min(10) });

export const authRoutes = Router();
authRoutes.post("/register", validate(registerSchema), AuthController.register);
authRoutes.post("/login", validate(loginSchema), AuthController.login);
authRoutes.post("/refresh", validate(tokenSchema), AuthController.refresh);
authRoutes.post("/logout", validate(tokenSchema), AuthController.logout);
