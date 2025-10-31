import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";
import { CategoriesController } from "../controllers/categories.controller";

export const categoriesRoutes = Router();

categoriesRoutes.get("/", CategoriesController.list);

const upsert = z.object({
  name: z.string().trim().min(2),
  sort_order: z.number().int().min(0).default(0)
});

categoriesRoutes.post("/", auth(true), requireRole("ADMIN"), validate(upsert), CategoriesController.create);
categoriesRoutes.patch("/:id", auth(true), requireRole("ADMIN"),
  validate(z.object({ id: z.string().uuid() }), "params"),
  validate(upsert), CategoriesController.update);
categoriesRoutes.delete("/:id", auth(true), requireRole("ADMIN"),
  validate(z.object({ id: z.string().uuid() }), "params"),
  CategoriesController.remove);
