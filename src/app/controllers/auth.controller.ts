import { Request, Response, NextFunction } from "express";
import { login } from "../../core/usecases/auth/login.usecase";
import { register } from "../../core/usecases/auth/register.usecase";
import { refresh } from "../../core/usecases/auth/refresh-token.usecase";
import { logout } from "../../core/usecases/auth/logout.usecase";

export const AuthController = {
  // 👤 Registro
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;
      const user = await register({ name, email, phone, password });
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // 🔐 Login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const out = await login({ identifier, password });
      return res.json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  },

  // ♻️ Refresh Token
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const out = await refresh({ refreshToken });
      return res.json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  },

  // 🚪 Logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await logout({ refreshToken });
      return res.status(204).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
