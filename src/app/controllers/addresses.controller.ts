import { Request, Response, NextFunction } from "express";
import * as usecase from "../../core/usecases/addresses/crud-address.usecase";
import { geocodeAddress } from "../../core/utils/geocode.util";

export const AddressesController = {
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usecase.listByUser((req as any).user.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const body = req.body;

      const { latitude, longitude } = await geocodeAddress({
        street: body.street,
        number: body.number,
        district: body.district,
        city: body.city,
        state: body.state,
        zip: body.zip,
      });

      const id = await usecase.create(userId, {
        ...body,
        latitude,
        longitude,
      });

      res.status(201).json({ success: true, data: { id } });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      await usecase.update((req as any).user.id, req.params.id, req.body);
      res.json({ success: true, data: { id: req.params.id } });
    } catch (e) {
      next(e);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await usecase.remove((req as any).user.id, req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
};
