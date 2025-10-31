import { Request, Response, NextFunction } from "express";
import * as usecase from "../../core/usecases/addresses/crud-address.usecase";

export const AddressesController = {
  async listMine(req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.listByUser((req as any).user.id) }); }
    catch (e){ next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try { const id = await usecase.create((req as any).user.id, req.body); res.status(201).json({ success: true, data: { id } }); }
    catch (e){ next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try { await usecase.update((req as any).user.id, req.params.id, req.body); res.json({ success: true, data: { id: req.params.id } }); }
    catch (e){ next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction){
    try { await usecase.remove((req as any).user.id, req.params.id); res.status(204).send(); }
    catch (e){ next(e); }
  }
};
