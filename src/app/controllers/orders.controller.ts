import { Request, Response, NextFunction } from "express";
import * as createCase from "../../core/usecases/orders/create-order.usecase";
import * as listCase from "../../core/usecases/orders/list-orders.usecase";
import * as getCase from "../../core/usecases/orders/get-order.usecase";
import * as updateCase from "../../core/usecases/orders/update-status.usecase";

export const OrdersController = {
  // 🛒 Criar pedido
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.id) throw new Error("Usuário não autenticado");

      const out = await createCase.createOrder({
        userId: user.id,
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
      const user = (req as any).user;
      if (!user?.id) throw new Error("Usuário não autenticado");

      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const out = await listCase.listByUser(user.id, page, pageSize);
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 🔎 Obter detalhes de um pedido
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.id) throw new Error("Usuário não autenticado");

      const out = await getCase.getByIdOwnerOrAdmin(user, req.params.id);
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // ⚙️ Atualizar status de um pedido (somente ADMIN)
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { id } = req.params;
      const { status } = req.body;

      if (!status) throw new Error("Status não fornecido");

      const out = await updateCase.updateStatus({
        orderId: id,
        newStatus: status,
        updatedBy: user.id,
      });

      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },
};
