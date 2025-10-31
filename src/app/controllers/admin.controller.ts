import { Request, Response, NextFunction } from "express";
import * as listCase from "../../core/usecases/orders/list-orders.usecase";
import * as statusCase from "../../core/usecases/orders/update-order-status.usecase";
import * as storeCase from "../../core/usecases/store/settings.usecase";
import * as auditCase from "../../core/usecases/orders/get-audit.usecase";
import * as hoursCase from "../../core/usecases/store/hours.usecase";

export const AdminController = {
  // 📦 Listar todos os pedidos (com filtros)
  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, from, to, page = 1, pageSize = 20 } = req.query as any;
      const out = await listCase.listAll({
        status,
        from,
        to,
        page: Number(page),
        pageSize: Number(pageSize),
      });
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 🔄 Atualizar status de um pedido
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await statusCase.updateStatus(
        (req as any).user.id,
        req.params.id,
        req.body.status
      );
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 🧾 Obter histórico de auditoria de status
  async getOrderAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await auditCase.getAudit(req.params.id);
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  // 🏪 Ver configurações da loja
  async getStoreSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await storeCase.getSettings() });
    } catch (e) {
      next(e);
    }
  },

  // ⚙️ Atualizar configurações da loja
  async updateStoreSettings(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await storeCase.updateSettings(req.body) });
    } catch (e) {
      next(e);
    }
  },

  // ⏰ Obter horários de funcionamento da loja
  async getStoreHours(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await hoursCase.listHours() });
    } catch (e) {
      next(e);
    }
  },

  // 🕒 Atualizar horários de funcionamento da loja
  async updateStoreHours(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await hoursCase.updateHours(req.body) });
    } catch (e) {
      next(e);
    }
  },
};
