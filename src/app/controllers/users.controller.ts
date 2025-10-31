import { Request, Response, NextFunction } from "express";
import * as usecase from "../../core/usecases/users/profile.usecase";

export const UsersController = {
  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usecase.getProfile((req as any).user.id);
      res.json({ success: true, data: user });
    } catch (e) { next(e); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await usecase.updateProfile((req as any).user.id, req.body);
      res.json({ success: true, data: out });
    } catch (e) { next(e); }
  }
};
