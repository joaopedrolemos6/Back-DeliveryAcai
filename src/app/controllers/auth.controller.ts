import { Request, Response, NextFunction } from "express";
import * as loginUseCase from "../../core/usecases/auth/login.usecase";
import * as registerUseCase from "../../core/usecases/auth/register.usecase";
import * as refreshUseCase from "../../core/usecases/auth/refresh-token.usecase";
import * as logoutUseCase from "../../core/usecases/auth/logout.usecase";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;
      const user = await registerUseCase.registerUser({ name, email, phone, password });
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const out = await loginUseCase.login({ identifier, password });
      return res.json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const out = await refreshUseCase.refresh({ refreshToken });
      return res.json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await logoutUseCase.logout({ refreshToken });
      return res.status(204).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
