import { ordersRepo } from "../../../infra/repositories/orders.repo";
import { NotFoundError, ForbiddenError } from "../../errors/app-error";

export async function getByIdOwnerOrAdmin(user:{id:string; role:"ADMIN"|"CLIENT"}, id:string){
  const o = await ordersRepo.findWithItems(id);
  if (!o) throw new NotFoundError("Order");
  if (user.role !== "ADMIN" && o.user_id !== user.id) throw new ForbiddenError("Not allowed");
  return o;
}
