import { Request, Response, NextFunction } from "express";
import { login } from "../../core/usecases/auth/login.usecase";
import { register } from "../../core/usecases/auth/register.usecase";
import { refresh } from "../../core/usecases/auth/refresh-token.usecase";
import { logout } from "../../core/usecases/auth/logout.usecase";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction){
    try {
      const out = await register(req.body);
      res.status(201).json({ success: true, data: out });
    } catch (e){ next(e); }
  },
  async login(req: Request, res: Response, next: NextFunction){
    try {
      const { identifier, password } = req.body;
      const out = await login(identifier, password);
      res.json({ success: true, data: out });
    } catch (e){ next(e); }
  },
  async refresh(req: Request, res: Response, next: NextFunction){
    try {
      const out = await refresh(req.body.refreshToken);
      res.json({ success: true, data: out });
    } catch (e){ next(e); }
  },
  async logout(req: Request, res: Response, next: NextFunction){
    try {
      await logout(req.body.refreshToken);
      res.status(204).send();
    } catch (e){ next(e); }
  }
};
