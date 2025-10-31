import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";
import { UsersController } from "../controllers/users.controller";

export const usersRoutes = Router();

usersRoutes.use(auth(true));

usersRoutes.get("/profile", UsersController.profile);

usersRoutes.patch("/profile",
  validate(z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().min(8).optional()
  })), UsersController.updateProfile);
