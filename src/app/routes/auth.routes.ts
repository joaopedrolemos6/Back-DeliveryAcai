import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";

// 🧾 Schema de registro
const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional(),
  phone: z.string().trim().min(8).optional(),
  password: z.string().min(6),
}).refine(d => !!d.email || !!d.phone, {
  message: "É necessário informar email ou telefone.",
});

// 🔐 Schema de login
const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Informe um email ou telefone válido"),
  password: z.string().min(6, "Senha muito curta"),
});

// 🔁 Schema de refresh/logout
const tokenSchema = z.object({
  refreshToken: z.string().min(10, "Token inválido"),
});

export const authRoutes = Router();

// 🧠 Registro de novo usuário
authRoutes.post("/register", validate(registerSchema), AuthController.register);

// 🔑 Login (email OU telefone)
authRoutes.post("/login", validate(loginSchema), AuthController.login);

// ♻️ Atualizar token
authRoutes.post("/refresh", validate(tokenSchema), AuthController.refresh);

// 🚪 Logout
authRoutes.post("/logout", validate(tokenSchema), AuthController.logout);
