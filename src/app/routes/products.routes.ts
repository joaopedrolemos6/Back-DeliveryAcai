import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";
import { auth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";

export const productsRoutes = Router();

productsRoutes.get("/",
  validate(z.object({
    category: z.string().uuid().optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
    sort: z.enum(["name","-name","price","-price"]).optional()
  }), "query"),
  ProductsController.list);

productsRoutes.get("/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  ProductsController.getById);

const upsert = z.object({
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2),
  description: z.string().trim().max(1000).optional(),
  price_cents: z.number().int().min(1),
  image_url: z.string().url().optional(),
  is_available: z.boolean().default(true)
});

productsRoutes.post("/", auth(true), requireRole("ADMIN"), validate(upsert), ProductsController.create);
productsRoutes.patch("/:id", auth(true), requireRole("ADMIN"),
  validate(z.object({ id: z.string().uuid() }), "params"),
  validate(upsert.partial()), ProductsController.update);
productsRoutes.delete("/:id", auth(true), requireRole("ADMIN"),
  validate(z.object({ id: z.string().uuid() }), "params"),
  ProductsController.remove);
