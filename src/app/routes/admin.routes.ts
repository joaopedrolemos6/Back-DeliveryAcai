import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";
import { AdminController } from "../controllers/admin.controller";

export const adminRoutes = Router();
adminRoutes.use(auth(true), requireRole("ADMIN"));

// Orders admin
adminRoutes.get("/orders", validate(z.object({
  status: z.enum(["PENDING","CONFIRMED","OUT_FOR_DELIVERY","DELIVERED","CANCELED"]).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}), "query"), AdminController.listOrders);

adminRoutes.patch("/orders/:id/status",
  validate(z.object({ id: z.string().uuid() }), "params"),
  validate(z.object({ status: z.enum(["CONFIRMED","OUT_FOR_DELIVERY","DELIVERED","CANCELED"]) })),
  AdminController.updateOrderStatus);

// Store settings
adminRoutes.get("/store-settings", AdminController.getStoreSettings);
adminRoutes.put("/store-settings",
  validate(z.object({
    delivery_fee_cents: z.number().int().min(0),
    min_order_cents: z.number().int().min(0),
    delivery_radius_km: z.number().min(0.1),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    is_open: z.boolean()
  })), AdminController.updateStoreSettings);

  adminRoutes.get("/orders/:id/audit",
  validate(z.object({ id: z.string().uuid() }), "params"),
  AdminController.getOrderAudit);

  adminRoutes.get("/store-hours", AdminController.getStoreHours);
adminRoutes.put("/store-hours", validate(z.array(z.object({
  weekday: z.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  close_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
}))), AdminController.updateStoreHours);
