import { Request, Response, NextFunction } from "express";
import * as createCase from "../../core/usecases/orders/create-order.usecase";
import * as listCase from "../../core/usecases/orders/list-orders.usecase";
import * as getCase from "../../core/usecases/orders/get-order.usecase";
import * as updateCase from "../../core/usecases/orders/update-status.usecase";

export const OrdersController = {
  // 🛒 Criar pedido
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await createCase.createOrder({
        userId: (req as any).user.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 📋 Listar pedidos do cliente autenticado
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, pageSize = 10 } = req.query as any;
      const out = await listCase.listByUser(
        (req as any).user.id,
        Number(page),
        Number(pageSize)
      );
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 🔎 Obter detalhes de um pedido
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await getCase.getByIdOwnerOrAdmin(
        (req as any).user,
        req.params.id
      );
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // ⚙️ Atualizar status de um pedido (somente ADMIN)
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const out = await updateCase.updateStatus({
        orderId: id,
        newStatus: status,
        updatedBy: (req as any).user.id,
      });

      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },
};
