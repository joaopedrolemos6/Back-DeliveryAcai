import { Request, Response, NextFunction } from "express";
import * as usecase from "../../core/usecases/products/crud-product.usecase";

export const ProductsController = {
  async list(req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.list(req.query) }); }
    catch (e){ next(e); }
  },
  async getById(req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.getById(req.params.id) }); }
    catch (e){ next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try { res.status(201).json({ success: true, data: await usecase.create(req.body) }); }
    catch (e){ next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.update(req.params.id, req.body) }); }
    catch (e){ next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction){
    try { await usecase.remove(req.params.id); res.status(204).send(); }
    catch (e){ next(e); }
  }
};
