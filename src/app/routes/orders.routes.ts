import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";
import { OrdersController } from "../controllers/orders.controller";
import { requireRole } from "../middlewares/rbac.middleware";

export const ordersRoutes = Router();

// ✅ Schema de criação de pedido
const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(["CASH", "PIX"]),
  note: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

// 🔐 Todas as rotas exigem autenticação
ordersRoutes.use(auth(true));

// 🛒 Criar pedido
ordersRoutes.post("/", validate(createOrderSchema), OrdersController.create);

// 📋 Listar pedidos do cliente (com paginação)
ordersRoutes.get(
  "/",
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
    }),
    "query"
  ),
  OrdersController.listMine
);

// 🔎 Obter detalhes de um pedido
ordersRoutes.get(
  "/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  OrdersController.getById
);

// ⚙️ Atualizar status (somente ADMIN)
ordersRoutes.patch(
  "/:id/status",
  requireRole("ADMIN"), // ✅ Ativa RBAC (somente admin)
  validate(
    z.object({
      id: z.string().uuid(),
      body: z.object({
        status: z.enum([
          "PENDING",
          "CONFIRMED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELED",
        ]),
      }),
    }),
    "params"
  ),
  OrdersController.updateStatus
);
