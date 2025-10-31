import { Express, Router } from "express";
import { authRoutes } from "./auth.routes";
import { productsRoutes } from "./products.routes";
import { categoriesRoutes } from "./categories.routes";
import { addressesRoutes } from "./addresses.routes";
import { ordersRoutes } from "./orders.routes";
import { adminRoutes } from "./admin.routes";

export function registerRoutes(app: Express) {
  const v1 = Router();
  v1.use("/auth", authRoutes);
  v1.use("/products", productsRoutes);
  v1.use("/categories", categoriesRoutes);
  v1.use("/addresses", addressesRoutes);
  v1.use("/orders", ordersRoutes);
  v1.use("/admin", adminRoutes);

  app.use("/v1", v1);
}
