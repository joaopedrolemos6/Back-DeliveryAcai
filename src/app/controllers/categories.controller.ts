import { Request, Response, NextFunction } from "express";
import * as usecase from "../../core/usecases/categories/crud-category.usecase";

export const CategoriesController = {
  async list(_req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.listCategories() }); }
    catch (e){ next(e); }
  },
  async create(req: Request, res: Response, next: NextFunction){
    try { res.status(201).json({ success: true, data: await usecase.createCategory(req.body) }); }
    catch (e){ next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction){
    try { res.json({ success: true, data: await usecase.updateCategory(req.params.id, req.body) }); }
    catch (e){ next(e); }
  },
  async remove(req: Request, res: Response, next: NextFunction){
    try { await usecase.deleteCategory(req.params.id); res.status(204).send(); }
    catch (e){ next(e); }
  }
};
