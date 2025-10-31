import { Router } from "express";
import { AddressesController } from "../controllers/addresses.controller";
import { auth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { z } from "zod";

export const addressesRoutes = Router();
addressesRoutes.use(auth(true));

const upsert = z.object({
  street: z.string().trim().min(2),
  number: z.string().trim().min(1),
  complement: z.string().trim().max(120).optional(),
  district: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  zip: z.string().trim().min(4),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

addressesRoutes.get("/", AddressesController.listMine);
addressesRoutes.post("/", validate(upsert), AddressesController.create);
addressesRoutes.patch("/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  validate(upsert.partial()), AddressesController.update);
addressesRoutes.delete("/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  AddressesController.remove);
